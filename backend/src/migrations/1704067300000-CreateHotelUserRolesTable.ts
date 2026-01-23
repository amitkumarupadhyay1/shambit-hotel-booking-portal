import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateHotelUserRolesTable1704067300000 implements MigrationInterface {
  name = 'CreateHotelUserRolesTable1704067300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create hotel_user_roles table
    await queryRunner.createTable(
      new Table({
        name: 'hotel_user_roles',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'hotelId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['HOTEL_OWNER', 'HOTEL_MANAGER', 'HOTEL_STAFF'],
            isNullable: false,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'assignedBy',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_hotel_user_roles_user_hotel',
            columnNames: ['userId', 'hotelId'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['hotelId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'enhanced_hotels',
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['assignedBy'],
            referencedColumnNames: ['id'],
            referencedTableName: 'users',
            onDelete: 'SET NULL',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('hotel_user_roles');
  }
}