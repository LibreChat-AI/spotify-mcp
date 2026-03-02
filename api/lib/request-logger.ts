import { Context } from "hono";
import type { Env } from "../../types";

export const requestLogger = async (c: Context<{ Bindings: Env }>, next: () => Promise<void>) => {
    console.log('=== Incoming Request ===');
    console.log(`Method: ${c.req.method}`);
    console.log(`URL: ${c.req.url}`);
    console.log(`Path: ${new URL(c.req.url).pathname}`);
    
    // Log all headers
    console.log('Headers:');
    const headers: Record<string, string> = {};
    c.req.raw.headers.forEach((value: string, key: string) => {
        headers[key] = value;
        console.log(`  ${key}: ${value}`);
    });
    
    // Log query parameters
    const url = new URL(c.req.url);
    if (url.searchParams.toString()) {
        console.log('Query Parameters:');
        url.searchParams.forEach((value, key) => {
            console.log(`  ${key}: ${value}`);
        });
    }
    
    // Log body for POST/PUT requests (be careful with sensitive data)
    if (c.req.method === 'POST' || c.req.method === 'PUT') {
        try {
            const contentType = c.req.header('content-type');
            console.log('Content-Type:', contentType);
            
            // Clone the request to read body without consuming it
            const clonedRequest = c.req.raw.clone();
            
            if (contentType?.includes('application/json')) {
                const text = await clonedRequest.text();
                try {
                    const body = JSON.parse(text);
                    console.log('Body (JSON):', JSON.stringify(body, null, 2));
                } catch {
                    console.log('Body (Raw):', text);
                }
            } else if (contentType?.includes('application/x-www-form-urlencoded')) {
                const text = await clonedRequest.text();
                console.log('Body (Form URL Encoded):', text);
                // Parse URL encoded data for better readability
                const params = new URLSearchParams(text);
                console.log('Parsed Form Data:');
                params.forEach((value, key) => {
                    // Mask sensitive data
                    if (key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
                        console.log(`  ${key}: [REDACTED]`);
                    } else {
                        console.log(`  ${key}: ${value}`);
                    }
                });
            } else {
                const text = await clonedRequest.text();
                console.log('Body (Raw):', text.substring(0, 1000)); // Limit to first 1000 chars
            }
        } catch (e) {
            console.log('Could not read body:', e);
        }
    }
    
    console.log('=== End Request Info ===\n');
    
    // Continue to next middleware/handler
    await next();
    
    // Log response status
    console.log(`Response Status: ${c.res.status}`);
}; 