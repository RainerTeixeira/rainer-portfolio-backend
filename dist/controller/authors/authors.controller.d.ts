import { AuthorsService } from './authors.service';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
export declare class AuthorsController {
    private readonly authorsService;
    constructor(authorsService: AuthorsService);
    create(createAuthorDto: CreateAuthorDto): Promise<{
        name: string;
        bio: string;
        website?: string;
        id: string;
    }>;
    findAll(): Promise<import("aws-sdk/clients/dynamodb").DocumentClient.ItemList | undefined>;
    findOne(id: string): Promise<import("aws-sdk/clients/dynamodb").DocumentClient.AttributeMap | undefined>;
    update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<import("aws-sdk/clients/dynamodb").DocumentClient.AttributeMap | undefined>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
