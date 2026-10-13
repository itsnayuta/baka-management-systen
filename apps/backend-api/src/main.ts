import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('ERP-Core-API');
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);

  // 1. Cấu hình CORS
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 2. Global Route Prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // 3. Global Input Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 4. Swagger OpenAPI Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Enterprise ERP & Operations Platform API')
    .setDescription(
      'Hệ thống Quản trị Doanh nghiệp Toàn diện: Tài chính (P&L, Sổ cái kép) - Nhân sự (Chấm công GPS, Bảng lương) - Tiến độ (Gantt, EVM Cost) - Quy trình Phê duyệt Đa cấp.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication', 'Xác thực & Cấp quyền JWT')
    .addTag('Employee Portal - Chấm công (Self-Service)', 'Cổng nhân viên: Điểm danh GPS, lịch sử công')
    .addTag('Employee Portal - Công việc (Self-Service)', 'Cổng nhân viên: Danh sách task, log giờ làm việc')
    .addTag('Employee Portal - Lương & Đãi ngộ (Self-Service)', 'Cổng nhân viên: Xem phiếu lương cá nhân (Payslip)')
    .addTag('Employee Portal - Đề xuất & Đơn từ (Self-Service)', 'Cổng nhân viên: Tạo đơn xin nghỉ, tạm ứng, chi phí')
    .addTag('Management Portal - Giám sát Chấm công', 'Cổng quản lý: Theo dõi tình hình chấm công toàn công ty')
    .addTag('Management Portal - Quản lý Dự án & Tiến độ', 'Cổng quản lý: Quản lý WBS, chi phí thực tế EVM, Workload Heatmap')
    .addTag('Management Portal - Tài chính & Kế toán Quản trị', 'Cổng quản lý: Sổ cái kép, Báo cáo P&L real-time, Dòng tiền & Runway')
    .addTag('Management Portal - Quản lý Bảng Lương (Payroll Engine)', 'Cổng quản lý: Chốt lương tự động, BHXH, Thuế TNCN')
    .addTag('Management Portal - Trạm Phê duyệt Tập trung (Approval Matrix)', 'Cổng quản lý: Phê duyệt đơn từ đa cấp theo hạn mức')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Enterprise ERP API Documentation',
  });

  // 5. Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);
  logger.log(`🚀 ERP Backend API is running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger API Documentation is available at: http://localhost:${port}/docs`);
}

bootstrap();
