"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MensajeError } from "@/components/ui/MensajeError";
import { useToast } from "@/components/ui/Toast";
import { Select } from "@/components/ui/Select";
import { formatearFecha } from "@/lib/formato";
import { textos } from "@/lib/textos";
import {
  cambiarRolAction,
  crearInvitacionAction,
  quitarMiembroAction,
  revocarInvitacionAction,
  type Resultado,
} from "../actions/equipo";
import { ROLES_INVITABLES, type InvitacionPendiente, type MiembroEquipo, type RolInvitable } from "../repositorio";

const t = textos.equipo;
const rutaInvitacion = (token: string) => `/invitacion/${token}`;

type Props = { miembros: MiembroEquipo[]; invitaciones: InvitacionPendiente[]; yo: string };

export function EquipoPanel({ miembros, invitaciones, yo }: Props) {
  const { avisar } = useToast();
  const [error, setError] = useState("");
  const [pendiente, empezar] = useTransition();

  function correr(accion: () => Promise<Resultado>, listo: string) {
    setError("");
    empezar(async () => {
      const r = await accion();
      if (r.ok) avisar(listo, { tipo: "exito" });
      else setError(r.error);
    });
  }

  async function copiar(token: string) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${rutaInvitacion(token)}`);
      avisar(t.enlaceCopiado, { tipo: "exito" });
    } catch {
      avisar(t.noSePudoCopiar, { tipo: "error" });
    }
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <MensajeError>{error}</MensajeError>

      <section aria-labelledby="miembros" className="flex flex-col gap-3">
        <h2 id="miembros" className="font-bold">
          {t.miembros}
        </h2>
        <ul className="flex flex-col gap-3">
          {miembros.map((m) => (
            <li key={m.usuarioId}>
              <FilaMiembro miembro={m} esYo={m.usuarioId === yo} deshabilitado={pendiente} correr={correr} />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="invitar" className="flex flex-col gap-3">
        <h2 id="invitar" className="font-bold">
          {t.invitar}
        </h2>
        <p className="text-sm text-texto-2">{t.invitarAyuda}</p>
        <Invitar deshabilitado={pendiente} correr={correr} />
        {invitaciones.length > 0 && (
          <ul className="flex flex-col gap-2">
            {invitaciones.map((i) => (
              <li key={i.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{textos.perfil.roles[i.rol]}</p>
                    <p className="text-sm text-texto-2">{t.vence(formatearFecha(i.venceEn))}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variante="secundario" onClick={() => copiar(i.token)}>
                      {t.copiarEnlace}
                    </Button>
                    <Button
                      type="button"
                      variante="secundario"
                      disabled={pendiente}
                      onClick={() => correr(() => revocarInvitacionAction(i.id), t.revocada)}
                    >
                      {t.revocar}
                    </Button>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="roles" className="flex flex-col gap-2">
        <h2 id="roles" className="font-bold">
          {t.rolesTitulo}
        </h2>
        <dl className="grid grid-cols-1 gap-2">
          {(["duena", ...ROLES_INVITABLES] as const).map((r) => (
            <div key={r}>
              <dt className="font-medium">{textos.perfil.roles[r]}</dt>
              <dd className="text-sm text-texto-2">{t.rolesAyuda[r]}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

function Invitar({ deshabilitado, correr }: { deshabilitado: boolean; correr: (a: () => Promise<Resultado>, listo: string) => void }) {
  const [rol, setRol] = useState<RolInvitable>("vendedora");
  return (
    <div className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t.rolDeLaInvitada}</span>
        <Select value={rol} onChange={(ev) => setRol(ev.target.value as RolInvitable)}>
          {ROLES_INVITABLES.map((r) => (
            <option key={r} value={r}>
              {textos.perfil.roles[r]}
            </option>
          ))}
        </Select>
      </label>
      <Button type="button" disabled={deshabilitado} onClick={() => correr(() => crearInvitacionAction(rol), t.creada)}>
        {t.crear}
      </Button>
    </div>
  );
}

function FilaMiembro({
  miembro: m,
  esYo,
  deshabilitado,
  correr,
}: {
  miembro: MiembroEquipo;
  esYo: boolean;
  deshabilitado: boolean;
  correr: (a: () => Promise<Resultado>, listo: string) => void;
}) {
  const [rol, setRol] = useState<RolInvitable>(m.rol === "duena" ? "vendedora" : (m.rol as RolInvitable));
  const [confirmando, setConfirmando] = useState(false);
  // La dueña no se cambia ni se quita, y tampoco uno mismo.
  const editable = m.rol !== "duena" && !esYo;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="min-w-0 truncate font-medium">
          {m.correo ?? t.sinCorreo}
          {esYo && <span className="ml-2 text-sm font-normal text-texto-2">({t.vos})</span>}
        </p>
        <span className="rounded-full bg-perla px-3 py-1 text-sm font-medium text-ambar-texto">{textos.perfil.roles[m.rol]}</span>
      </div>

      {editable && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t.cambiarRol}</span>
            <Select value={rol} onChange={(ev) => setRol(ev.target.value as RolInvitable)}>
              {ROLES_INVITABLES.map((r) => (
                <option key={r} value={r}>
                  {textos.perfil.roles[r]}
                </option>
              ))}
            </Select>
          </label>
          <Button
            type="button"
            variante="secundario"
            disabled={deshabilitado || rol === m.rol}
            onClick={() => correr(() => cambiarRolAction(m.usuarioId, rol), t.rolCambiado)}
          >
            {t.guardarRol}
          </Button>

          {confirmando ? (
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t.quitarConfirmar}>
              <span className="text-sm">{t.quitarConfirmar}</span>
              <Button type="button" disabled={deshabilitado} onClick={() => correr(() => quitarMiembroAction(m.usuarioId), t.quitado)}>
                {t.quitarSi}
              </Button>
              <Button type="button" variante="secundario" onClick={() => setConfirmando(false)}>
                {t.quitarNo}
              </Button>
            </div>
          ) : (
            <Button type="button" variante="secundario" onClick={() => setConfirmando(true)}>
              {t.quitar}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
