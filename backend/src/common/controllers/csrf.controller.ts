import { Controller, Get } from '@nestjs/common';

@Controller()
export class CsrfController {
    @Get('csrf-token')
    getCsrfToken() {
        // This endpoint is intercepted by CSRFProtectionMiddleware
        // The middleware handles token generation and returns the response directly
        return { message: 'CSRF token endpoint placeholder' };
    }
}
