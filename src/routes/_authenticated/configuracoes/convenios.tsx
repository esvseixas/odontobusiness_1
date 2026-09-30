import { createFileRoute } from "@tanstack/react-router";
import { ConveniosPage } from "@/components/configuracoes/paginas";
export const Route=createFileRoute("/_authenticated/configuracoes/convenios")({head:()=>({meta:[{title:"Convênios | OdontoGestor"},{name:"description",content:"Configuração dos convênios aceitos."},{property:"og:title",content:"Convênios | OdontoGestor"},{property:"og:description",content:"Configuração dos convênios aceitos."},{property:"og:type",content:"website"},{name:"twitter:card",content:"summary"}]}),component:ConveniosPage});
