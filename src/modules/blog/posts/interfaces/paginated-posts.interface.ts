// paginated-posts.interface.ts
import { ApiProperty } from '@nestjs/swagger';
import { PostSummaryDto } from '../dto/post-summary.dto';

export class PaginatedPostsResult {
    @ApiProperty({
        type: [PostSummaryDto],
        description: 'Lista de posts na página atual'
    })
    items: PostSummaryDto[];

    @ApiProperty({
        type: String,
        nullable: true,
        example: 'eyJJRCI6eyJTIjoibThuN3IxbWNiIn19',
        description: 'Token para próxima página (codificado em Base64)'
    })
    nextKey: string | null;

    @ApiProperty({
        type: Object,
        description: 'Metadados da operação',
        example: {
            count: 10,
            scannedCount: 15,
            capacityUnits: 2.5
        }
    })
    metadata: {
        count?: number;
        scannedCount?: number;
        capacityUnits?: number;
    };
}