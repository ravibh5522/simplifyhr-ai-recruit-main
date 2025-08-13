# SimplifyHR Offer Letter API v3.0.0

A comprehensive FastAPI-based service for generating and sending personalized offer letters with professional email delivery capabilities.

## Features

### Core Functionality
- **Template Processing**: Convert DOCX templates with placeholder replacement
- **Multi-format Output**: Generate both DOCX and PDF formats
- **Bulk Email Sending**: Send offer letters to multiple recipients with attachments
- **Template Validation**: Validate templates and extract placeholders

### Advanced Features
- **Rate Limiting**: Protect against abuse with configurable limits
- **Background Processing**: Asynchronous email sending with status tracking
- **Health Monitoring**: Comprehensive health checks and system metrics
- **File Management**: Automatic cleanup of temporary files
- **Error Handling**: Robust error handling with detailed logging
- **Configuration Management**: Environment-based configuration
- **Security**: Input validation and secure file handling

### API Endpoints

#### Core Endpoints
- `POST /api/v1/generate-offer` - Generate offer letter from template and data
- `POST /api/v1/send-offer` - Send PDF offer letter via email
- `GET /api/v1/email-status/{request_id}` - Check email sending status
- `GET /api/v1/download/{file_id}` - Download generated files

#### Monitoring Endpoints
- `GET /health` - Health check with system information
- `GET /stats` - Application statistics and metrics
- `GET /metrics` - Prometheus metrics (if enabled)

#### Utility Endpoints
- `DELETE /api/v1/cleanup` - Manual cleanup of temporary files
- `GET /` - API information and documentation links

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your SMTP settings and other configuration
```

### 3. Run the Server
```bash
python run_server.py
```

### 4. Access Documentation
- API Docs: http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Statistics: http://localhost:8000/stats

## Configuration

### Required Environment Variables
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@yourcompany.com
```

### Optional Configuration
See `.env.example` for all available configuration options including:
- Rate limiting settings
- File size limits
- Cleanup intervals
- Feature flags
- Performance tuning

## Usage Examples

### 1. Generate Offer Letter

```bash
curl -X POST "http://localhost:8000/api/v1/generate-offer" \
  -F "template_file=@offer_template.docx" \
  -F "data_file=@candidate_data.json" \
  -F "output_format=both"
```

**candidate_data.json:**
```json
{
  "candidate_name": "John Doe",
  "position": "Software Engineer",
  "salary": "₹15,00,000",
  "start_date": "2024-01-15",
  "company_name": "Tech Corp"
}
```

### 2. Send Offer Letter

```bash
curl -X POST "http://localhost:8000/api/v1/send-offer" \
  -F "pdf_file=@offer_letter.pdf" \
  -F 'email_data={
    "emails": ["candidate@example.com", "hr@company.com"],
    "subject": "Offer Letter - Software Engineer Position",
    "html_content": "<h1>Congratulations!</h1><p>Please find your offer letter attached.</p>"
  }'
```

### 3. Check Email Status

```bash
curl -X GET "http://localhost:8000/api/v1/email-status/request-uuid"
```

## Template Format

DOCX templates support placeholder replacement in the following formats:

### Standard Placeholders
```
{candidate_name}
{position}
{salary}
{start_date}
{company_name}
```

### Alternative Format
```
{{candidate_name}}
{{position}}
{{salary}}
```

## Response Formats

### Successful Offer Generation
```json
{
  "success": true,
  "request_id": "uuid-123",
  "message": "Offer letter generated successfully",
  "files": {
    "docx": "/api/v1/download/offer-letter-uuid-123.docx",
    "pdf": "/api/v1/download/offer-letter-uuid-123.pdf"
  },
  "processing_time": 2.34,
  "metadata": {
    "template_name": "standard_offer.docx",
    "generated_at": "2024-01-15T10:30:00Z",
    "data_fields": ["candidate_name", "position", "salary"],
    "file_sizes": {
      "docx": 25600,
      "pdf": 180432
    }
  }
}
```

### Email Sending Response
```json
{
  "message": "Email sending initiated",
  "request_id": "email-uuid-456",
  "total_recipients": 2,
  "status": "processing"
}
```

### Email Status Response
```json
{
  "request_id": "email-uuid-456",
  "status": "completed",
  "progress_percentage": 100.0,
  "total_recipients": 2,
  "sent_count": 2,
  "failed_count": 0,
  "pending_count": 0,
  "errors": [],
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:32:15Z",
  "duration": 135.0
}
```

## Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "3.0.0",
  "uptime": 3600.5,
  "services": {
    "database": "healthy",
    "email_service": "healthy",
    "document_processor": "healthy",
    "file_system": "healthy"
  },
  "system_info": {
    "cpu_usage": 15.2,
    "memory_usage": 45.8,
    "disk_usage": 23.1,
    "python_version": "3.9.7",
    "platform": "Linux-5.4.0"
  }
}
```

## Architecture

### Components
- **FastAPI Application**: Main API server with async support
- **Document Processor**: Handles DOCX template processing and PDF generation
- **Email Service**: Manages bulk email sending with retry logic
- **Health Service**: Monitors system health and provides metrics
- **Configuration System**: Environment-based configuration management
- **Logging System**: Structured logging with rotation and filtering

### File Structure
```
send_offer_v3/
├── main.py                 # FastAPI application
├── run_server.py          # Server startup script
├── requirements.txt       # Dependencies
├── .env.example          # Environment configuration template
├── models/
│   └── schemas.py        # Pydantic models
├── services/
│   ├── document_processor.py  # Document processing logic
│   ├── email_service.py      # Email sending logic
│   └── health_service.py     # Health monitoring
├── core/
│   ├── config.py         # Configuration management
│   └── logger.py         # Logging setup
├── temp/                 # Temporary files (auto-created)
├── outputs/              # Generated files (auto-created)
└── logs/                 # Log files (auto-created)
```

## Dependencies

### Core Dependencies
- **FastAPI**: Modern, fast web framework
- **Uvicorn**: ASGI server
- **python-docx**: DOCX document processing
- **aiofiles**: Async file operations
- **aiosmtplib**: Async SMTP client
- **reportlab**: PDF generation (fallback)
- **jinja2**: Template rendering
- **pydantic**: Data validation

### Optional Dependencies
- **docx2pdf**: DOCX to PDF conversion (requires LibreOffice)
- **loguru**: Advanced logging
- **prometheus-client**: Metrics collection
- **psutil**: System monitoring

## Deployment

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

# Install LibreOffice for PDF conversion
RUN apt-get update && apt-get install -y libreoffice

COPY . .
EXPOSE 8000
CMD ["python", "run_server.py"]
```

### Production Considerations
- Use environment variables for all sensitive configuration
- Enable rate limiting in production
- Set up log rotation and monitoring
- Configure reverse proxy (nginx) for static file serving
- Use a process manager (supervisor/systemd) for auto-restart
- Set up health check monitoring
- Configure firewall rules

## Monitoring

### Built-in Monitoring
- Health checks with service status
- Request/response metrics
- Performance statistics
- Error tracking and logging
- System resource monitoring

### External Monitoring
- Prometheus metrics endpoint
- Structured JSON logging
- Webhook notifications (optional)
- Slack integration (optional)

## Security Features

- Input validation and sanitization
- File type and size restrictions
- Rate limiting protection
- Secure file handling
- Error message sanitization
- CORS configuration
- Environment-based secrets

## Troubleshooting

### Common Issues

1. **PDF Generation Fails**
   - Install LibreOffice: `apt-get install libreoffice`
   - Check LIBREOFFICE_PATH in environment

2. **Email Sending Fails**
   - Verify SMTP settings
   - Check firewall/network connectivity
   - Use app passwords for Gmail

3. **Template Processing Issues**
   - Ensure template uses supported placeholder format
   - Check JSON data structure matches placeholders

4. **Performance Issues**
   - Adjust MAX_CONCURRENT_REQUESTS
   - Monitor system resources via /health endpoint
   - Enable background cleanup

### Logs
Check logs in the `logs/` directory:
- `simplifyhr_YYYY-MM-DD.log` - General application logs
- `error_YYYY-MM-DD.log` - Error logs in JSON format
- `api_YYYY-MM-DD.log` - API request logs

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the health endpoint: `/health`
- Review logs in the `logs/` directory
- Check configuration in `.env`
- Consult the API documentation at `/docs`
