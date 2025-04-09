/**
 * Representa a tabela "Authors" no banco de dados.
 * Chave de partição: authorId
 */
export class Authors {
  /** Chave de partição única para identificar o autor */
  authorId: string;

  /** Nome do autor */
  name: string;

  /** Slug único para o autor */
  slug: string;

  /** Provas sociais do autor, como links para redes sociais */
  socialProof: {
    /** URL do perfil no Facebook */
    facebook: string;

    /** URL do perfil no GitHub */
    github: string;

    /** URL do perfil no LinkedIn */
    linkdin: string;
  };
}
