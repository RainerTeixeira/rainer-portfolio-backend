// common/utils/dynamo-helper.ts
export class DynamoHelper {
    static mapPaginatedResult<T>(result: QueryCommandOutput, mapper: (item: any) => T): PaginatedResult<T> {
        return {
            items: result.Items?.map(mapper) || [],
            nextToken: result.LastEvaluatedKey ? this.encodeToken(result.LastEvaluatedKey) : null,
            metadata: {
                count: result.Count,
                scannedCount: result.ScannedCount,
                capacityUnits: result.ConsumedCapacity?.CapacityUnits
            }
        };
    }

    static encodeToken(key: Record<string, any>): string {
        return Buffer.from(JSON.stringify(key)).toString('base64url');
    }
}