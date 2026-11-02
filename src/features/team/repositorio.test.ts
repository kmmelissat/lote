import { describe, expect, it } from "vitest";
import { supabaseFalso } from "@/test/supabaseFalso";
import { aceptarInvitacion, cambiarRol, esRolInvitable, esTokenInvitacion, listarEquipo, verInvitacion } from "./repositorio";

describe("validaciones", () => {
  it("a la dueña no se la invita", () => {
    expect(esRolInvitable("vendedora")).toBe(true);
    expect(esRolInvitable("duena")).toBe(false);
    expect(esRolInvitable(undefined)).toBe(false);
  });

  it("el código de invitación son 64 caracteres hexadecimales en minúscula", () => {
    expect(esTokenInvitacion("a".repeat(64))).toBe(true);
    expect(esTokenInvitacion("A".repeat(64))).toBe(false);
    expect(esTokenInvitacion("a".repeat(63))).toBe(false);
  });
});

describe("equipo", () => {
  it("arma cada miembro con su fecha", async () => {
    const data = [{ usuario_id: "u1", rol: "vendedora", correo: "ana@x.com", creado_en: "2026-10-01T00:00:00Z" }];
    const { cliente } = supabaseFalso({ rpc: { equipo_del_negocio: { data, error: null } } });
    expect(await listarEquipo(cliente, "n1")).toEqual([{ usuarioId: "u1", rol: "vendedora", correo: "ana@x.com", desde: new Date("2026-10-01T00:00:00Z") }]);
  });

  it("cambiar el rol sin tocar ninguna fila es que no había permiso", async () => {
    const { cliente } = supabaseFalso({ tablas: { miembro: { data: [], error: null } } });
    expect(await cambiarRol(cliente, "n1", "u1", "vendedora")).toBe(false);
  });
});

describe("invitaciones", () => {
  it("una invitación que no existe o venció no se ve", async () => {
    const { cliente } = supabaseFalso({ rpc: { invitacion_publica: { data: [], error: null } } });
    expect(await verInvitacion(cliente, "a".repeat(64))).toBeNull();
  });

  it("aceptar solo devuelve lo que conoce", async () => {
    const con = (data: unknown, error: unknown = null) => supabaseFalso({ rpc: { aceptar_invitacion: { data, error } } }).cliente;
    expect(await aceptarInvitacion(con("ok"), "t")).toBe("ok");
    expect(await aceptarInvitacion(con("ya_tiene_negocio"), "t")).toBe("ya_tiene_negocio");
    expect(await aceptarInvitacion(con("raro"), "t")).toBe("error");
    expect(await aceptarInvitacion(con(null, new Error("no")), "t")).toBe("error");
  });
});
