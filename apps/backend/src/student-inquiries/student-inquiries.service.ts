import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StudentInquiry, StudentInquiryDocument } from '../schemas';
import { CreateStudentInquiryDto } from './dto/create-student-inquiry.dto';

@Injectable()
export class StudentInquiriesService {
  constructor(
    @InjectModel(StudentInquiry.name)
    private readonly inquiryModel: Model<StudentInquiryDocument>,
  ) {}

  async create(dto: CreateStudentInquiryDto): Promise<StudentInquiry> {
    const inquiry = new this.inquiryModel({
      studentName: dto.studentName,
      age: dto.age,
      courses: dto.courses || [],
      preferredDays: dto.preferredDays || [],
      classTime: dto.classTime,
      email: dto.email,
      phoneOrWhatsapp: dto.phoneOrWhatsapp,
      classLanguage: dto.classLanguage,
      message: dto.message || '',
      status: 'NEW',
    });
    return inquiry.save();
  }

  async findAll(status?: string): Promise<StudentInquiry[]> {
    const filter = status ? { status } : {};
    return this.inquiryModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<StudentInquiry> {
    const inquiry = await this.inquiryModel.findById(id).exec();
    if (!inquiry) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }
    return inquiry;
  }

  async updateStatus(id: string, status: string, notes?: string): Promise<StudentInquiry> {
    const updateData: any = { status };
    if (notes !== undefined) updateData.notes = notes;

    const updated = await this.inquiryModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Inquiry with ID ${id} not found`);
    }
    return updated;
  }
}
