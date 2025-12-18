# DynamoDB Single Table Design

## Visão Geral

Usaremos uma única tabela (Single Table Design) para otimizar custos e performance no modo PAY_PER_REQUEST.

## Estrutura da Tabela

### Tabela: `portfolio-backend-table`

#### Atributos Base
- `PK` (String) - Partition Key
- `SK` (String) - Sort Key
- `GSI1PK` (String) - Global Secondary Index 1 PK
- `GSI1SK` (String) - Global Secondary Index 1 SK
- `GSI2PK` (String) - Global Secondary Index 2 PK
- `GSI2SK` (String) - Global Secondary Index 2 SK
- `entityType` (String) - Tipo da entidade
- `createdAt` (String) - ISO timestamp
- `updatedAt` (String) - ISO timestamp
- `data` (Map) - Atributos específicos da entidade

## Padrões de PK/SK

### Usuários
```
PK = USER#<userId>
SK = PROFILE
GSI1PK = USER#<email>
GSI1SK = PROFILE
entityType = USER
```

### Posts
```
PK = POST#<postId>
SK = METADATA
GSI1PK = POST#STATUS#<status>
GSI1SK = <createdAt>
GSI2PK = CATEGORY#<categoryId>
GSI2SK = POST#<createdAt>
entityType = POST
```

### Comentários
```
PK = POST#<postId>
SK = COMMENT#<commentId>
GSI1PK = COMMENT#<userId>
GSI1SK = POST#<createdAt>
entityType = COMMENT
```

### Likes
```
PK = POST#<postId>
SK = LIKE#<userId>
GSI1PK = USER#<userId>
GSI1SK = LIKE#<createdAt>
entityType = LIKE
```

### Categorias
```
PK = CATEGORY#<categoryId>
SK = METADATA
GSI1PK = CATEGORY#SLUG#<slug>
GSI1SK = METADATA
entityType = CATEGORY
```

### Notificações
```
PK = USER#<userId>
SK = NOTIFICATION#<notificationId>
GSI1PK = USER#<userId>
GSI1SK = NOTIFICATION#<createdAt>
entityType = NOTIFICATION
```

### Bookmarks
```
PK = USER#<userId>
SK = BOOKMARK#<postId>
GSI1PK = USER#<userId>
GSI1SK = BOOKMARK#<createdAt>
entityType = BOOKMARK
```

## GSIs (Global Secondary Indexes)

### GSI1
- **Uso**: Consultas por usuário, status, email
- **PK**: `GSI1PK`
- **SK**: `GSI1SK`

### GSI2
- **Uso**: Consultas por categoria
- **PK**: `GSI2PK`
- **SK**: `GSI2SK`

## Exemplos de Consulta

### 1. Buscar usuário por email
```
{
  TableName: "portfolio-backend-table",
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :pk",
  ExpressionAttributeValues: {
    ":pk": "USER#user@example.com"
  }
}
```

### 2. Listar posts por categoria
```
{
  TableName: "portfolio-backend-table",
  IndexName: "GSI2",
  KeyConditionExpression: "GSI2PK = :pk AND begins_with(GSI2SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": "CATEGORY#cat-123",
    ":sk": "POST#"
  }
}
```

### 3. Listar notificações do usuário
```
{
  TableName: "portfolio-backend-table",
  KeyConditionExpression: "PK = :pk AND begins_with(SK, :sk)",
  ExpressionAttributeValues: {
    ":pk": "USER#user-123",
    ":sk": "NOTIFICATION#"
  }
}
```

## Vantagens

1. **Custo**: Uma única tabela = menor custo fixo
2. **Performance**: Consultas otimizadas com GSIs
3. **Escalabilidade**: PAY_PER_REQUEST escala automaticamente
4. **Simplicidade**: Um ponto de gerenciamento

## Capacidade Provisionada

- **Modo**: PAY_PER_REQUEST (paga pelo consumo)
- **Free Tier**: 25GB armazenamento + 25 unidades RCU/WCU
- **Estimativa**: < $5/mês para aplicação pequena/média
