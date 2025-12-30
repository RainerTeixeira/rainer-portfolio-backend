# Design de Tabela Única DynamoDB - Blog API

## Visão Geral
Design de tabela única usando padrão PK/SK com 3 GSIs para performance e custo otimizados.

## Estrutura da Tabela
**Nome da Tabela**: `${StackName}-${Environment}-blog`

### Padrão da Chave Primária
```
PK = ENTITY#<entityId>
SK = TYPE#<sortKey>#<timestamp>
```

## Mapeamento das Entidades

### 1. Usuários
```
PK = USER#<cognitoSub>
SK = PROFILE#<cognitoSub>
GSI1PK = USER#<cognitoSub>
GSI1SK = PROFILE
GSI2PK = ROLE#<role>
GSI2SK = USER#<cognitoSub>
```

### 2. Posts
```
PK = POST#<postId>
SK = POST#<postId>
GSI1PK = CATEGORY#<subcategoryId>
GSI1SK = POST#<publishedAt>#<postId>
GSI2PK = AUTHOR#<authorId>
GSI2SK = POST#<publishedAt>#<postId>
```

### 3. Categorias (Hierarquia)
```
# Categoria Principal
PK = CATEGORY#<categoryId>
SK = CATEGORY#<categoryId>
GSI1PK = CATEGORY_ROOT
GSI1SK = CATEGORY#<order>#<categoryId>

# Subcategoria
PK = CATEGORY#<subcategoryId>
SK = CATEGORY#<subcategoryId>
GSI1PK = CATEGORY#<parentId>
GSI1SK = CATEGORY#<order>#<subcategoryId>

# Relacionamento Pai-Filho
PK = CATEGORY#<parentId>
SK = CHILD#<childId>#<order>
```

### 4. Comentários
```
PK = POST#<postId>
SK = COMMENT#<commentId>#<createdAt>
GSI1PK = COMMENT#<commentId>
GSI1SK = POST#<postId>
GSI2PK = AUTHOR#<authorId>
GSI2SK = COMMENT#<createdAt>#<commentId>

# Respostas (replies)
PK = POST#<postId>
SK = COMMENT#<parentId>#<replyId>#<createdAt>
```

### 5. Curtidas (Likes)
```
PK = POST#<postId>
SK = LIKE#<userId>#<createdAt>
GSI1PK = LIKE#<userId>#<postId>
GSI1SK = LIKE
GSI2PK = AUTHOR#<authorId>
GSI2SK = LIKE#<createdAt>
```

### 6. Favoritos (Bookmarks)
```
PK = USER#<userId>
SK = BOOKMARK#<postId>#<createdAt>
GSI1PK = BOOKMARK#<userId>
GSI1SK = BOOKMARK#<createdAt>#<postId>
GSI2PK = POST#<postId>
GSI2SK = BOOKMARK#<userId>
```

### 7. Notificações
```
PK = USER#<userId>
SK = NOTIFICATION#<notificationId>#<createdAt>
GSI1PK = NOTIFICATION#<userId>
GSI1SK = NOTIFICATION#<createdAt>#<notificationId>
```

## Padrões de Acesso & Consultas

### 1. Obter Perfil do Usuário
```
Query {
  PK: "USER#<cognitoSub>",
  SK: "PROFILE#<cognitoSub>"
}
```

### 2. Obter Posts por Categoria (paginado)
```
Query {
  IndexName: "GSI1",
  KeyConditionExpression: "GSI1PK = :category",
  ScanIndexForward: false,
  Limit: 10
}
```

### 3. Obter Posts de um Usuário
```
Query {
  IndexName: "GSI2",
  KeyConditionExpression: "GSI2PK = :author",
  ScanIndexForward: false
}
```

### 4. Obter Comentários de um Post (em thread)
```
# Primeira consulta (comentários raiz)
Query {
  PK: "POST#<postId>",
  SK: "COMMENT#"
}

# Depois buscar respostas para cada comentário
Query {
  PK: "POST#<postId>",
  SK: "COMMENT#<commentId>#"
}
```

## Configuração das GSIs

### GSI1 - Acesso por Categoria/Entidade
- **PK**: GSI1PK
- **SK**: GSI1SK
- **Propósito**: Posts por categoria, hierarquia de categorias, buscas por entidade

### GSI2 - Atividade do Usuário
- **PK**: GSI2PK
- **SK**: GSI2SK
- **Propósito**: Posts, comentários, curtidas, notificações de um usuário

## Atributos dos Itens

### Atributos Comuns
- `entityType` (String): USER, POST, CATEGORY, etc.
- `createdAt` (String): timestamp ISO
- `updatedAt` (String): timestamp ISO

### Atributos Específicos por Tipo
Cada tipo de entidade armazena seus atributos específicos como campos de primeiro nível.

## Modo de Capacidade
**PAY_PER_REQUEST** - Ideal para Free Tier, escala automaticamente.

## Resumo de Índices
- 1 tabela + 3 GSIs = 4 índices no total
- Todas as consultas usam acesso por chave (sem scans)
- Otimizado para carga de leitura intensa em blog
