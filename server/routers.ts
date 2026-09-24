import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { appSettings, estimateItems, estimates, pricingRules, users } from "../drizzle/schema";
import { buildWhatsAppMessage, calculateLineTotal, calculateServiceBasePrice, calculateUnitPrice, dirtLevelInfo, dirtLevels, formatEstimateNumber, type DirtLevel, type ServiceType } from "../shared/quote";
import { clearUserSession, createUserSession, hashPassword, sanitizeUser, verifyPassword } from "./auth";
import { getAuthorizedUserCount, getCredentialUser, getDb, getEstimateWithItems, getPricingRuleById, listAuthorizedUsers, listEstimates, listPricingRules, listSettings } from "./db";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { systemRouter } from "./_core/systemRouter";

const states = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"] as const;
const stateSchema = z.enum(states); const serviceSchema = z.enum(["lavagem", "impermeabilizacao", "lavagem_impermeabilizacao"]); const dirtSchema = z.enum(dirtLevels);
const catalogSchema = z.object({ id: z.number().int().positive().optional(), productKey: z.string().trim().min(1).max(48), productName: z.string().trim().min(1).max(80), description: z.string().trim().max(280).default(""), sortOrder: z.number().int().nonnegative().default(0), places: z.string().trim().min(1).max(32), itemType: z.string().trim().min(1).max(64), fabric: z.string().trim().min(1).max(64), washPrice: z.number().nonnegative(), waterproofPrice: z.number().nonnegative(), active: z.boolean().default(true) });
const cache = new Map<string, { names: string[]; normalized: Set<string> }>();
const numberValue = (value: string | number) => typeof value === "number" ? value : Number(value);
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
async function municipalities(state: (typeof states)[number]) { const existing = cache.get(state); if (existing) return existing; let response: Response; try { response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios`, { signal: AbortSignal.timeout(8000) }); } catch { throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Não foi possível validar a cidade agora. Tente novamente." }); } if (!response.ok) throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Não foi possível validar a cidade agora. Tente novamente." }); const names = ((await response.json()) as Array<{ nome?: string }>).map(item => item.nome?.trim() ?? "").filter(Boolean).sort((a, b) => a.localeCompare(b, "pt-BR")); const data = { names, normalized: new Set(names.map(normalize)) }; cache.set(state, data); return data; }
async function initializeCredentialUsers() { const db = await getDb(); if (!db) return; const seeds = [{ username: "thaynara.campos", name: "Thaynara Campos", role: "admin" as const, password: process.env.CASAL_CLEAN_THAY_PASSWORD }, { username: "henrique.carlos", name: "Henrique Carlos", role: "admin" as const, password: process.env.CASAL_CLEAN_HENRIQUE_PASSWORD }, { username: "usuario.dev", name: "Usuário de Desenvolvimento", role: "user" as const, password: process.env.CASAL_CLEAN_DEV_PASSWORD }]; for (const seed of seeds) { if (!seed.password) continue; const found = await getCredentialUser(seed.username); if (!found) await db.insert(users).values({ username: seed.username, name: seed.name, passwordHash: hashPassword(seed.password), loginMethod: "password", role: seed.role, active: true }); } }

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(({ ctx }) => ctx.user ? sanitizeUser(ctx.user) : null),
    login: publicProcedure.input(z.object({ username: z.string().trim().min(3), password: z.string().min(1) })).mutation(async ({ ctx, input }) => { await initializeCredentialUsers(); const user = await getCredentialUser(input.username.toLowerCase()); if (!user || !verifyPassword(input.password, user.passwordHash)) throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário ou senha inválidos." }); await createUserSession(ctx.req, ctx.res, user.id); return sanitizeUser(user); }),
    logout: publicProcedure.mutation(async ({ ctx }) => { await clearUserSession(ctx.req, ctx.res); return { success: true } as const; }),
  }),
  catalog: router({ list: protectedProcedure.query(async () => (await listPricingRules()).map(rule => ({ ...rule, washPrice: numberValue(rule.washPrice), waterproofPrice: numberValue(rule.waterproofPrice) }))) }),
  address: router({ municipalities: protectedProcedure.input(z.object({ state: stateSchema })).query(async ({ input }) => (await municipalities(input.state)).names) }),
  estimates: router({
    list: protectedProcedure.input(z.object({ quoteNumber: z.number().int().positive().optional(), customerName: z.string().trim().min(1).max(160).optional() })).query(async ({ input }) => (await listEstimates(input)).map(estimate => ({ ...estimate, quoteNumber: formatEstimateNumber(estimate.id), total: numberValue(estimate.total), subtotal: numberValue(estimate.subtotal) }))),
    get: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => { const result = await getEstimateWithItems(input.id); if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado." }); return { estimate: { ...result.estimate, quoteNumber: formatEstimateNumber(result.estimate.id), total: numberValue(result.estimate.total), subtotal: numberValue(result.estimate.subtotal) }, items: result.items.map(item => ({ ...item, unitPrice: numberValue(item.unitPrice), lineTotal: numberValue(item.lineTotal) })) }; }),
    message: protectedProcedure.input(z.object({ id: z.number().int().positive() })).query(async ({ input }) => {
      const result = await getEstimateWithItems(input.id);
      if (!result) throw new TRPCError({ code: "NOT_FOUND", message: "Orçamento não encontrado." });
      return {
        quoteNumber: formatEstimateNumber(result.estimate.id),
        message: buildWhatsAppMessage({
          quoteNumber: formatEstimateNumber(result.estimate.id),
          customerName: result.estimate.customerName,
          customerPhone: result.estimate.customerPhone,
          customerAddress: result.estimate.customerAddress,
          customerCity: result.estimate.customerCity,
          customerState: result.estimate.customerState,
          scheduledAt: result.estimate.scheduledAt,
          scheduleStatus: result.estimate.scheduleStatus,
          total: numberValue(result.estimate.total),
          items: result.items.map(item => ({ productName: item.productName, places: item.places, itemType: item.itemType, fabric: item.fabric, dirtLevel: item.dirtLevel, service: item.service, quantity: item.quantity, unitPrice: numberValue(item.unitPrice), lineTotal: numberValue(item.lineTotal) })),
        }),
      };
    }),
    save: protectedProcedure.input(z.object({ customerName: z.string().trim().min(3).max(160), customerPhone: z.string().trim().refine(value => /^[1-9]\d(?:9\d{8}|\d{8})$/.test(value.replace(/\D/g, "")), "Informe um telefone brasileiro válido."), customerAddress: z.string().trim().min(8).max(1000).refine(value => /\d/.test(value), "Informe rua, número e bairro."), customerCity: z.string().trim().min(2).max(160), customerState: stateSchema, scheduledAt: z.string().datetime().optional(), scheduleStatus: z.enum(["scheduled", "to_define"]).default("scheduled"), expectedTotal: z.number().finite().nonnegative(), items: z.array(z.object({ pricingRuleId: z.number().int().positive(), dirtLevel: dirtSchema, service: serviceSchema, quantity: z.number().int().min(1).max(100) })).min(1) })).mutation(async ({ ctx, input }) => {
      const db = await getDb(); if (!db || !ctx.user) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." }); const city = await municipalities(input.customerState); if (!city.normalized.has(normalize(input.customerCity))) throw new TRPCError({ code: "BAD_REQUEST", message: "A cidade informada não pertence à UF selecionada." });
      const calculated: Array<{ rule: NonNullable<Awaited<ReturnType<typeof getPricingRuleById>>>; dirtLevel: DirtLevel; service: ServiceType; quantity: number; unitPrice: number; lineTotal: number }> = [];
      for (const item of input.items) { const rule = await getPricingRuleById(item.pricingRuleId); if (!rule || !rule.active) throw new TRPCError({ code: "BAD_REQUEST", message: "Um dos preços selecionados não está mais disponível." }); const base = calculateServiceBasePrice(numberValue(rule.washPrice), numberValue(rule.waterproofPrice), item.service); calculated.push({ rule, dirtLevel: item.dirtLevel, service: item.service, quantity: item.quantity, unitPrice: calculateUnitPrice(base, item.dirtLevel), lineTotal: calculateLineTotal(base, item.dirtLevel, item.quantity) }); }
      const total = calculated.reduce((sum, item) => sum + item.lineTotal, 0); if (Math.abs(total - input.expectedTotal) > 0.001) throw new TRPCError({ code: "BAD_REQUEST", message: "O total do orçamento foi alterado. Revise os itens antes de enviar." }); const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date(); if (Number.isNaN(scheduledAt.getTime())) throw new TRPCError({ code: "BAD_REQUEST", message: "Selecione uma data e horário válidos." });
      const inserted = await db.insert(estimates).values({ customerName: input.customerName, customerPhone: input.customerPhone, customerAddress: input.customerAddress, customerCity: input.customerCity, customerState: input.customerState, scheduledAt, scheduleStatus: input.scheduleStatus, subtotal: total.toFixed(2), total: total.toFixed(2), createdByUserId: ctx.user.id }); const id = Number(inserted[0]?.insertId); if (!id) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível gerar o identificador do orçamento." });
      await db.insert(estimateItems).values(calculated.map(item => ({ estimateId: id, pricingRuleId: item.rule.id, productKey: item.rule.productKey, productName: item.rule.productName, places: item.rule.places, itemType: item.rule.itemType, fabric: item.rule.fabric, dirtLevel: item.dirtLevel, dirtSurcharge: dirtLevelInfo[item.dirtLevel].surcharge, service: item.service, quantity: item.quantity, unitPrice: item.unitPrice.toFixed(2), lineTotal: item.lineTotal.toFixed(2) }))); const result = await getEstimateWithItems(id); if (!result) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Não foi possível concluir o orçamento." }); const quoteNumber = formatEstimateNumber(id); const message = buildWhatsAppMessage({ quoteNumber, customerName: result.estimate.customerName, customerPhone: result.estimate.customerPhone, customerAddress: result.estimate.customerAddress, customerCity: result.estimate.customerCity, customerState: result.estimate.customerState, scheduledAt: result.estimate.scheduledAt, scheduleStatus: result.estimate.scheduleStatus, total, items: result.items.map(item => ({ productName: item.productName, places: item.places, itemType: item.itemType, fabric: item.fabric, dirtLevel: item.dirtLevel, service: item.service, quantity: item.quantity, unitPrice: numberValue(item.unitPrice), lineTotal: numberValue(item.lineTotal) })) }); return { estimateId: id, quoteNumber, total, message };
    }),
  }),
  admin: router({
    priceList: adminProcedure.query(async () => (await listPricingRules(true)).map(rule => ({ ...rule, washPrice: numberValue(rule.washPrice), waterproofPrice: numberValue(rule.waterproofPrice) }))),
    savePrice: adminProcedure.input(catalogSchema).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." }); const { id, ...fields } = input; const values = { ...fields, washPrice: input.washPrice.toFixed(2), waterproofPrice: input.waterproofPrice.toFixed(2) }; if (id) { await db.update(pricingRules).set(values).where(eq(pricingRules.id, id)); return { id }; } const inserted = await db.insert(pricingRules).values(values); return { id: Number(inserted[0].insertId) }; }),
    removePrice: adminProcedure.input(z.object({ id: z.number().int().positive() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); await db.update(pricingRules).set({ active: false }).where(eq(pricingRules.id, input.id)); return { success: true } as const; }),
    users: adminProcedure.query(() => listAuthorizedUsers()),
    saveUser: adminProcedure.input(z.object({ id: z.number().int().positive().optional(), username: z.string().trim().min(3).max(64).optional(), name: z.string().trim().min(2).max(160), role: z.enum(["admin", "user"]), active: z.boolean(), password: z.string().min(8).optional() })).mutation(async ({ input }) => { const db = await getDb(); if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" }); if (!input.id) { if (!input.username || !input.password) throw new TRPCError({ code: "BAD_REQUEST", message: "Usuário e senha são obrigatórios." }); if (await getAuthorizedUserCount() >= 3) throw new TRPCError({ code: "BAD_REQUEST", message: "O limite de três usuários autorizados já foi atingido." }); const inserted = await db.insert(users).values({ username: input.username.toLowerCase(), name: input.name, passwordHash: hashPassword(input.password), loginMethod: "password", role: input.role, active: input.active }); return { id: Number(inserted[0].insertId) }; } await db.update(users).set({ name: input.name, role: input.role, active: input.active, ...(input.password ? { passwordHash: hashPassword(input.password) } : {}) }).where(eq(users.id, input.id)); return { id: input.id }; }),
    settings: adminProcedure.query(() => listSettings()),
    saveSettings: adminProcedure.input(z.array(z.object({ settingKey: z.string().trim().min(1).max(80), settingValue: z.string().trim().max(1000) })).min(1)).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Banco de dados indisponível." });
      for (const setting of input) {
        await db.insert(appSettings).values(setting).onDuplicateKeyUpdate({ set: { settingValue: setting.settingValue } });
      }
      return { success: true } as const;
    }),
  }),
});
export type AppRouter = typeof appRouter;
