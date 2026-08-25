import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Material, MaterialDocument, MaterialCategory } from '../schemas';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectModel(Material.name) private readonly materialModel: Model<MaterialDocument>,
  ) {}

  async create(file: any, createDto: CreateMaterialDto, userId: string) {
    if (!file) {
      throw new Error('A PDF file is required');
    }

    const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
    const materialsDir = path.join(uploadsDir, 'materials');
    if (!fs.existsSync(materialsDir)) {
      fs.mkdirSync(materialsDir, { recursive: true });
    }

    const safeName = `${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const targetPath = path.join(materialsDir, safeName);
    fs.writeFileSync(targetPath, file.buffer);

    const fileUrl = `/uploads/materials/${safeName}`;

    const material = await this.materialModel.create({
      title: createDto.title,
      description: createDto.description,
      category: createDto.category || MaterialCategory.GENERAL,
      targetLevel: createDto.targetLevel || 'All',
      courseId: createDto.courseId || undefined,
      fileName: file.originalname,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype || 'application/pdf',
      uploadedBy: userId,
      downloadsCount: 0,
      isActive: true,
    });

    return this.materialModel.findById(material._id)
      .populate('uploader', 'id name email')
      .populate('course', 'id title');
  }

  async findAll(query?: { category?: string; targetLevel?: string; search?: string }) {
    const filter: any = { isActive: true };

    if (query?.category && query.category !== 'ALL') {
      filter.category = query.category;
    }

    if (query?.targetLevel && query.targetLevel !== 'ALL') {
      filter.targetLevel = query.targetLevel;
    }

    if (query?.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { fileName: { $regex: query.search, $options: 'i' } },
      ];
    }

    return this.materialModel.find(filter)
      .populate('uploader', 'id name email')
      .populate('course', 'id title')
      .sort({ createdAt: -1 });
  }

  async findOne(id: string) {
    const material = await this.materialModel.findOne({ _id: id, isActive: true })
      .populate('uploader', 'id name email')
      .populate('course', 'id title');
    if (!material) {
      throw new NotFoundException('Material not found');
    }
    return material;
  }

  async incrementDownload(id: string) {
    const material = await this.materialModel.findByIdAndUpdate(
      id,
      { $inc: { downloadsCount: 1 } },
      { new: true },
    );
    if (!material) {
      throw new NotFoundException('Material not found');
    }
    return material;
  }

  async update(id: string, updateDto: UpdateMaterialDto) {
    const material = await this.materialModel.findByIdAndUpdate(
      id,
      { $set: updateDto },
      { new: true },
    ).populate('uploader', 'id name email')
     .populate('course', 'id title');

    if (!material) {
      throw new NotFoundException('Material not found');
    }
    return material;
  }

  async remove(id: string) {
    const material = await this.materialModel.findById(id);
    if (!material) {
      throw new NotFoundException('Material not found');
    }

    // Try deleting physical file
    try {
      const uploadsDir = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
      const filename = path.basename(material.fileUrl);
      const filePath = path.join(uploadsDir, 'materials', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (_) {}

    return this.materialModel.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
  }
}
