import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  getReferralDiscountForUser, 
  getFreeExtraSlotsForUser,
  getUserEffectiveMaxActiveItems,
  processReferralOnSignup
} from '../lib/referrals';
import * as firebase from '../integrations/firebase';

vi.mock('../integrations/firebase', () => ({
  fetchCollection: vi.fn(),
  fetchDocument: vi.fn(),
  fetchCollectionGroup: vi.fn(),
  setDocument: vi.fn(),
  updateDocument: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn()
}));

const mockFetchCollection = firebase.fetchCollection as any;
const mockFetchDocument = firebase.fetchDocument as any;
const mockFetchCollectionGroup = firebase.fetchCollectionGroup as any;
const mockSetDocument = firebase.setDocument as any;

describe('Sistema de Indicações (Referral)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desconto para usuários Premium que indicam', () => {
    it('deve aplicar 20% de desconto por 1 indicação Premium ativa', async () => {
      mockFetchCollection.mockResolvedValue({
        data: [{ planType: 'premium_monthly', status: 'active' }],
        error: null
      });

      const discount = await getReferralDiscountForUser('user123');
      expect(discount).toBe(20);
    });

    it('deve acumular descontos com múltiplas indicações', async () => {
      mockFetchCollection.mockResolvedValue({
        data: [
          { planType: 'premium_monthly', status: 'active' },
          { planType: 'premium_annual', status: 'active' }
        ],
        error: null
      });

      const discount = await getReferralDiscountForUser('user123');
      expect(discount).toBe(60); 
    });

    it('não deve ultrapassar 100% de desconto', async () => {
      mockFetchCollection.mockResolvedValue({
        data: Array(10).fill({ planType: 'premium_monthly', status: 'active' }),
        error: null
      });

      const discount = await getReferralDiscountForUser('user123');
      expect(discount).toBe(100);
    });
  });

  describe('Slots extras para usuários Free que indicam', () => {
    it('deve adicionar 1 slot de medicamento por indicação Free ativa', async () => {
      // Mock para a subscrição (free user)
      mockFetchDocument.mockResolvedValue({
        data: { planType: 'free', status: 'active' },
        error: null
      });

      // Mock para as 2 indicações ativas
      mockFetchCollection.mockResolvedValue({
        data: [
          { status: 'active', activatedAt: new Date().toISOString() },
          { status: 'active', activatedAt: new Date().toISOString() }
        ],
        error: null
      });

      const maxActive = await getUserEffectiveMaxActiveItems('user123');
      expect(maxActive).toBe(4); // 2 (base) + 2 (extra slots)
    });

    it('não deve exceder o máximo de slots extras permitidos', async () => {
      mockFetchDocument.mockResolvedValue({
        data: { planType: 'free', status: 'active' },
        error: null
      });

      mockFetchCollection.mockResolvedValue({
        data: Array(10).fill({ status: 'active', activatedAt: new Date().toISOString() }),
        error: null
      });

      const maxActive = await getUserEffectiveMaxActiveItems('user123');
      expect(maxActive).toBe(5); // 2 (base) + 3 (max extra)
    });
  });

  describe('Trial premium para quem é indicado', () => {
    it('novo usuário indicado deve registrar a indicação com status pending', async () => {
      // Adaptado para a implementação real de processReferralOnSignup
      mockFetchCollectionGroup.mockResolvedValue({
        data: [{ userId: 'referrer123', referralCode: 'VALIDE123' }],
        error: null
      });

      await processReferralOnSignup('newUser123', 'VALIDE123');
      
      expect(mockSetDocument).toHaveBeenCalledWith(
        'users/referrer123/referrals',
        'newUser123',
        expect.objectContaining({
          referrerUserId: 'referrer123',
          referredUserId: 'newUser123',
          referralCodeUsed: 'VALIDE123',
          planType: 'free',
          status: 'pending'
        })
      );
    });

    it('código de indicação inválido não deve conceder trial', async () => {
      mockFetchCollectionGroup.mockResolvedValue({
        data: [],
        error: null
      });

      await processReferralOnSignup('newUser123', 'INVALIDO123');
      
      expect(mockSetDocument).not.toHaveBeenCalled();
    });
  });
});
