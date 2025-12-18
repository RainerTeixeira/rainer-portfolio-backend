/**
 * @fileoverview DTO legado de atualização de usuário
 *
 * DTO simples/legado para atualização de usuário. Em algumas partes do sistema,
 * pode existir um DTO mais completo (`UpdateUserData`) no arquivo
 * `create-user.dto.ts`.
 *
 * @module modules/users/dto/update-user.dto
 */

/**
 * Payload mínimo para atualização.
 */
export class UpdateUserDto {
  name?: string;
  password?: string;
}
