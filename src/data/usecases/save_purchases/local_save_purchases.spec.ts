import { mockPurchases, CacheStoreSpy } from "@/data/tests";
import { LocalSavePurchases } from "@/data/usecases/save_purchases/local_save_purchases";

type SutTypes = {
    sut: LocalSavePurchases;
    cacheStore: CacheStoreSpy;
}

const makeSut = (timestamp = new Date()): SutTypes => {
    const cacheStore = new CacheStoreSpy();
    const sut = new LocalSavePurchases(cacheStore, timestamp);
    return {
        sut,
        cacheStore
    };
}

describe('LocalSavePurchases', () => {
    test('Should not delete or insert cache on sut.init', () => {
        const { cacheStore } = makeSut();
        expect(cacheStore.messages).toEqual([]);
    })

    test('Should not insert new Cache if delete fails', async () => {
        const { cacheStore, sut } = makeSut();
        cacheStore.simulateDeleteError();
        const promise = sut.save(mockPurchases());
        expect(cacheStore.messages).toEqual([CacheStoreSpy.Message.delete]);
        await expect(promise).rejects.toThrow();
    })

    test('Should insert new Cache if delete succeeds', async () => {
        const timestamp = new Date();
        const { cacheStore, sut } = makeSut();
        const purchases = mockPurchases();
        const promise = await sut.save(purchases);
        expect(cacheStore.messages).toEqual([CacheStoreSpy.Message.delete, CacheStoreSpy.Message.insert]);
        expect(cacheStore.insertKey).toBe('purchases');
        expect(cacheStore.deleteKey).toBe('purchases');
        expect(cacheStore.insertValues).toEqual({
            timestamp,
            value: purchases
        });
        await expect(promise).resolves;
    })

    test('Should throws if insert throws', async () => {
        const { cacheStore, sut } = makeSut();
        cacheStore.simulateInsertError();
        const promise = sut.save(mockPurchases());
        expect(cacheStore.messages).toEqual([CacheStoreSpy.Message.delete, CacheStoreSpy.Message.insert]);
        await expect(promise).rejects.toThrow();
    })
})