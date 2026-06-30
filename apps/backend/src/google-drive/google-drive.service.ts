import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from 'googleapis';
import * as fs from 'fs';

@Injectable()
export class GoogleDriveService {
  private readonly logger = new Logger(GoogleDriveService.name);
  private oauth2Client: any;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('GOOGLE_DRIVE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('GOOGLE_DRIVE_CLIENT_SECRET');
    const redirectUri = this.configService.get<string>('GOOGLE_DRIVE_REDIRECT_URI');
    const refreshToken = this.configService.get<string>('GOOGLE_DRIVE_REFRESH_TOKEN');

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  async uploadFile(filePath: string, filename: string): Promise<{ fileId: string; webViewUrl: string }> {
    try {
      this.logger.log(`Starting Google Drive upload for: ${filePath}`);
      const drive = google.drive({ version: 'v3', auth: this.oauth2Client });

      const fileMetadata = {
        name: filename,
      };

      const media = {
        mimeType: 'video/mp4',
        body: fs.createReadStream(filePath),
      };

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
      });

      const fileId = response.data.id;
      const webViewUrl = response.data.webViewLink;

      if (!fileId || !webViewUrl) {
        throw new Error('Google Drive API returned empty response fields');
      }

      this.logger.log(`Google Drive upload successful. File ID: ${fileId}`);

      // Set reader permissions for link holders to allow direct playback streams
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      });

      return { fileId, webViewUrl };
    } catch (err: any) {
      this.logger.error(`Google Drive upload failed: ${err.message}`);
      throw err;
    }
  }
}
