import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('TransferController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /transfer with valid txhash and vendorA returns success', () => {
    return request(app.getHttpServer())
      .post('/transfer')
      .send({ amount: 100, vendor: 'vendorA', txhash: '0x1234567890abcdef' })
      .expect(201)
      .expect((res) => {
        expect(res.body.txhashStatus).toBe('confirmed');
        expect(res.body.vendorResponse?.status).toBe('success');
      });
  });

  it('POST /transfer with invalid txhash returns not found', () => {
    return request(app.getHttpServer())
      .post('/transfer')
      .send({ amount: 100, vendor: 'vendorA', txhash: 'notavalidhash' })
      .expect(201)
      .expect((res) => {
        expect(res.body.txhashStatus).toBe('not found');
        expect(res.body.error).toBeDefined();
      });
  });

  it('POST /transfer with vendorB returns pending', () => {
    return request(app.getHttpServer())
      .post('/transfer')
      .send({ amount: 50, vendor: 'vendorB', txhash: '0xabcdef1234567890' })
      .expect(201)
      .expect((res) => {
        expect(res.body.txhashStatus).toBe('confirmed');
        expect(res.body.vendorResponse?.status).toBe('pending');
      });
  });
});
