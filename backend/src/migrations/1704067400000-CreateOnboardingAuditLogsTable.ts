import { MigrationInterface, QueryRunner, Table, Index, ForeignKey } from 'typeorm';

export class CreateOnboardingAuditLogsTable1704067400000 implements MigrationInterface {
  name = 'CreateOnboardingAuditLogsTable1704067400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create onboarding_audit_logs table
    await queryRunner.createTable(
      new Table({
        name: 'onboarding_audit_logs',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'action',
            type: 'enum',
            enum: [
              'SESSION_CREATED',
              'SESSION_UPDATED',
              'SESSION_COMPLETED',
              'SESSION_DELETED',
              'STEP_UPDATED',
              'STEP_COMPLETED',
              'DRAFT_SAVED',
              'QUALITY_REPORT_GENERATED',
              'ROLE_ASSIGNED',
              'ROLE_REMOVED',
              'PERMISSION_DENIED',
              'DATA_EXPORTED',
              'HOTEL_DATA_UPDATED',
            ],
            isNullable: false,
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
            name: 'sessionId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'stepId',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'previousData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'newData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_onboarding_audit_logs_hotel_created',
            columnNames: ['hotelId', 'createdAt'],
          },
          {
            name: 'IDX_onboarding_audit_logs_user_created',
            columnNames: ['userId', 'createdAt'],
          },
          {
            name: 'IDX_onboarding_audit_logs_action_created',
            columnNames: ['action', 'createdAt'],
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
            columnNames: ['sessionId'],
            referencedColumnNames: ['id'],
            referencedTableName: 'onboarding_sessions',
            onDelete: 'CASCADE',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('onboarding_audit_logs');
  }
}