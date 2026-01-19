import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PropertyInformationService } from '../../src/modules/hotels/services/property-information.service';
import { EnhancedHotel } from '../../src/modules/hotels/entities/enhanced-hotel.entity';

describe('PropertyInformationService - Simple Test', () => {
  let service: PropertyInformationService;
  let repository: Repository<EnhancedHotel>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PropertyInformationService,
        {
          provide: getRepositoryToken(EnhancedHotel),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PropertyInformationService>(PropertyInformationService);
    repository = module.get<Repository<EnhancedHotel>>(getRepositoryToken(EnhancedHotel));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have updatePropertyDescription method', () => {
    expect(typeof service.updatePropertyDescription).toBe('function');
  });

  it('should have formatForCustomerDisplay method', () => {
    expect(typeof service.formatForCustomerDisplay).toBe('function');
  });
});