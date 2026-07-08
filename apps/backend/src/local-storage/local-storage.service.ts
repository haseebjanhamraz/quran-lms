import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

@Injectable()
export class LocalStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly storageDir: string;

  constructor(private readonly configService: ConfigService) {
    this.storageDir = path.resolve(
      this.configService.get<string>('RECORDINGS_DIR') || './recordings'
    );
    this.ensureStorageDirectoryExists();
  }

  private ensureStorageDirectoryExists() {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
      this.logger.log(`Created recordings storage directory at: ${this.storageDir}`);
    }
  }

  async saveFile(sourcePath: string, filename: string): Promise<{ filePath: string; fileSize: number }> {
    this.logger.log(`Saving file ${sourcePath} to local storage with name ${filename}`);
    this.ensureStorageDirectoryExists();
    const destPath = path.join(this.storageDir, filename);

    if (!fs.existsSync(sourcePath)) {
      throw new NotFoundException(`Source file not found at: ${sourcePath}`);
    }

    const resolvedSource = path.resolve(sourcePath);
    const resolvedDest = path.resolve(destPath);
    if (resolvedSource !== resolvedDest) {
      await fs.promises.copyFile(resolvedSource, resolvedDest);
    }
    const stats = await fs.promises.stat(resolvedDest);

    return {
      filePath: filename,
      fileSize: stats.size,
    };
  }

  getFilePath(filename: string): string {
    return path.join(this.storageDir, filename);
  }

  async deleteFile(filename: string): Promise<void> {
    const filePath = this.getFilePath(filename);
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`Deleted file: ${filePath}`);
      }
    } catch (err: any) {
      this.logger.error(`Failed to delete file ${filePath}: ${err.message}`);
    }
  }

  async streamFile(filename: string, res: Response, rangeHeader?: string): Promise<void> {
    const filePath = this.getFilePath(filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Recording file not found: ${filename}`);
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const mimeType = this.getMimeType(filename);

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        res.status(416).header('Content-Range', `bytes */${fileSize}`).send();
        return;
      }

      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': mimeType,
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': mimeType,
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
  }

  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.webm') return 'video/webm';
    if (ext === '.mkv') return 'video/x-matroska';
    return 'video/mp4';
  }
}
