import { DynamoDB } from 'aws-sdk';
import { CreateAuthorDto } from './dto/create-author.dto';
import { UpdateAuthorDto } from './dto/update-author.dto';
export declare class AuthorsService {
    private readonly dynamoDb;
    private readonly tableName;
    create(createAuthorDto: CreateAuthorDto): Promise<{
        name: string;
        bio: string;
        website?: string;
        id: string;
    }>;
    findAll(): Promise<DynamoDB.DocumentClient.ItemList | undefined>;
    findOne(id: string): Promise<DynamoDB.DocumentClient.AttributeMap | undefined>;
    update(id: string, updateAuthorDto: UpdateAuthorDto): Promise<DynamoDB.DocumentClient.AttributeMap | undefined>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
