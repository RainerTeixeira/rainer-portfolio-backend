import { ConfigService } from "@nestjs/config";
export declare class CognitoAuthService {
    private readonly configService;
    private verifier;
    constructor(configService: ConfigService);
    verifyToken(token: string): Promise<any>;
    getCognitoConfig(): {
        region: string | undefined;
        accessKeyId: string | undefined;
        secretAccessKey: string | undefined;
        userPoolId: string | undefined;
        clientId: string | undefined;
        jwksUrl: string | undefined;
    };
}
