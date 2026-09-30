import { createFileRoute } from "@tanstack/react-router";
import { AuditoriaPage } from "@/components/configuracoes/paginas";
export const Route=createFileRoute("/_authenticated/configuracoes/auditoria")({head:()=>({meta:[{title:"Auditoria | OdontoGestor"},{name:"description",content:"Histórico de atividades e segurança da clínica."},{property:"og:title",content:"Auditoria | OdontoGestor"},{property:"og:description",content:"Histórico de atividades e segurança da clínica."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:AuditoriaPage});
