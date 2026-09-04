import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
const CSS = `@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');

  :root{--bg:#f4f8fb;--bg2:#e9f1f7;--ink:#0e2233;--muted:#5b7388;--brand:#0ea5b7;--brand2:#0b7c8c;--gold:#d9b36b;--line:#dbe6ee}
  *{box-sizing:border-box}html{scroll-behavior:smooth}
  body{margin:0;background:var(--bg);color:var(--ink);font-family:"Sora",sans-serif;overflow-x:hidden}
  .serif{font-family:"Fraunces",serif}
  .display{font-family:"Fraunces",serif;font-weight:600;line-height:1.02;letter-spacing:-.01em}
  .container{max-width:1180px;margin:0 auto;padding-left:26px;padding-right:26px}
  .cine{position:fixed;inset:0;z-index:0;overflow:hidden;background:var(--bg);transform:translateZ(0)}
  .cine .l{position:absolute;inset:-25%;filter:blur(70px);opacity:.5;will-change:transform}
  .l1{background:radial-gradient(38% 38% at 22% 20%,rgba(14,165,183,.22),transparent 70%);animation:d1 26s ease-in-out infinite}
  .l2{background:radial-gradient(42% 42% at 80% 30%,rgba(217,179,107,.18),transparent 70%);animation:d2 30s ease-in-out infinite}
  @keyframes d1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(6%,5%) scale(1.12)}}
  @keyframes d2{0%,100%{transform:translate(0,0) scale(1.1)}50%{transform:translate(-7%,4%) scale(1)}}
  .wrap{position:relative;z-index:2}
  .brandtext{color:var(--brand)}
  .kicker{display:inline-flex;align-items:center;gap:9px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:var(--brand2);border:1px solid rgba(14,165,183,.3);background:rgba(14,165,183,.07);padding:8px 15px;border-radius:999px}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;font-weight:700;border-radius:13px;padding:16px 28px;text-decoration:none;transition:transform .25s,box-shadow .25s;font-size:15px}
  .btn-wa{background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;box-shadow:0 16px 40px rgba(37,211,102,.32)}
  .btn-wa:hover{transform:translateY(-2px)}
  .btn-brand{background:linear-gradient(180deg,var(--brand),var(--brand2));color:#fff;box-shadow:0 16px 40px rgba(14,165,183,.3)}
  .btn-brand:hover{transform:translateY(-2px)}
  .btn-ghost{border:1px solid rgba(14,34,51,.18);color:var(--ink)}.btn-ghost:hover{background:rgba(14,34,51,.04)}
  .reveal{opacity:1}.reveal.in{animation:rin .7s cubic-bezier(.16,1,.3,1) both}@keyframes rin{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  .card{background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 10px 34px rgba(14,34,51,.05)}
  .hair{height:1px;background:linear-gradient(90deg,transparent,rgba(14,165,183,.4),transparent)}
  .frame{border-radius:22px;overflow:hidden;position:relative;box-shadow:0 40px 90px rgba(11,60,80,.2)}
  .navwrap{position:fixed;top:14px;left:0;right:0;z-index:40;transition:.3s}
  .navwrap.s{top:9px}
  .navwrap>div{background:color-mix(in srgb,var(--bg) 62%,transparent);-webkit-backdrop-filter:saturate(1.6) blur(18px);backdrop-filter:saturate(1.6) blur(18px);border:1px solid color-mix(in srgb,var(--ink) 11%,transparent);border-radius:18px;box-shadow:0 10px 30px rgba(14,34,51,.08),inset 0 1px 0 rgba(255,255,255,.5);transition:.3s}
  .navwrap.s>div{background:color-mix(in srgb,var(--bg) 84%,transparent);box-shadow:0 14px 38px rgba(14,34,51,.12)}
  .mark{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--brand),var(--brand2));display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-family:"Fraunces",serif}
  details.faq{border-bottom:1px solid var(--line)}
  details.faq summary{list-style:none;cursor:pointer;padding:20px 4px;display:flex;justify-content:space-between;gap:16px;align-items:center;font-weight:600;font-size:17px}
  details.faq summary::-webkit-details-marker{display:none}
  details.faq[open] .pl{transform:rotate(45deg)} .pl{transition:.3s;color:var(--brand);font-size:24px;font-weight:700}
  .field{width:100%;background:#fff;border:1px solid var(--line);border-radius:12px;padding:14px 16px;color:var(--ink);outline:none;font-size:15px}.field:focus{border-color:var(--brand)}
  .wa{position:fixed;right:20px;bottom:20px;z-index:45;display:flex;align-items:center;gap:10px;padding:13px 18px 13px 14px;border-radius:999px;background:linear-gradient(135deg,#25D366,#128C7E);color:#fff;font-weight:700;font-size:14px;text-decoration:none;box-shadow:0 16px 40px rgba(37,211,102,.45)}
  .wa .ic{width:24px;height:24px;display:flex;align-items:center;justify-content:center}
  .wa::before{content:"";position:absolute;left:14px;top:50%;transform:translateY(-50%);width:24px;height:24px;border-radius:50%;background:rgba(255,255,255,.5);animation:pr 2s infinite}
  @keyframes pr{0%{transform:translateY(-50%) scale(.6);opacity:.7}70%,100%{transform:translateY(-50%) scale(1.8);opacity:0}}
  @media (prefers-reduced-motion:reduce){.l1,.l2,.wa::before{animation:none}.reveal.in{animation:none}}
`;
const BODY = `
<!--
  ╔══════════════════════════════════════════════════════════════╗
  ║  CONFIG — EDITE AQUI (ou peça pra IA da Lovable preencher)     ║
  ║  Troque [colchetes], fotos (links), WhatsApp (wa.me/55...) e   ║
  ║  cores no :root (--brand, --bg). Nicho: ODONTOLOGIA.          ║
  ╚══════════════════════════════════════════════════════════════╝
-->
<div class="cine"><div class="l l1"></div><div class="l l2"></div></div>

<div class="wrap">
  <!-- HEADER -->
  <nav class="navwrap" id="nav"><div class="container flex items-center justify-between h-[64px] px-5">
    <a href="#topo" class="flex items-center gap-3"><span class="mark">O</span><span class="serif text-xl font-semibold">[Sua Clínica]</span></a>
    <div class="hidden md:flex items-center gap-7 text-sm text-[color:var(--muted)]">
      <a href="#tratamentos" class="hover:text-[color:var(--ink)] transition">Tratamentos</a>
      <a href="#sobre" class="hover:text-[color:var(--ink)] transition">A clínica</a>
      <a href="#resultados" class="hover:text-[color:var(--ink)] transition">Resultados</a>
      <a href="#avaliacoes" class="hover:text-[color:var(--ink)] transition">Avaliações</a>
      <a href="#faq" class="hover:text-[color:var(--ink)] transition">FAQ</a>
    </div>
    <a href="https://wa.me/5511900000000" class="btn btn-wa !py-2.5 !px-5 !text-sm">Agendar avaliação</a>
  </div></nav>

  <!-- HERO -->
  <header id="topo" class="container pt-36 pb-20 md:pt-44 md:pb-28 grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
    <div>
      <div class="reveal kicker">★ Avaliação sem compromisso · parcelamos em até 12x</div>
      <h1 class="reveal display text-6xl md:text-7xl mt-7">O sorriso que você<br>sempre quis, <span class="brandtext italic">sem medo</span>.</h1>
      <p class="reveal text-lg md:text-xl text-[color:var(--muted)] max-w-xl mt-7 leading-relaxed">[Diga o que sua clínica faz e pra quem.] Atendimento humanizado, tecnologia de ponta e um plano de tratamento claro — do implante à harmonização. Aqui você entende cada passo antes de começar.</p>
      <div class="reveal flex flex-col sm:flex-row gap-4 mt-10"><a href="https://wa.me/5511900000000" class="btn btn-wa">Agendar avaliação →</a><a href="#tratamentos" class="btn btn-ghost">Ver tratamentos</a></div>
      <div class="reveal flex items-center gap-4 mt-10">
        <div class="flex -space-x-3">
          <img src="https://i.pravatar.cc/80?img=32" class="w-10 h-10 rounded-full border-2 object-cover" style="border-color:var(--bg)">
          <img src="https://i.pravatar.cc/80?img=45" class="w-10 h-10 rounded-full border-2 object-cover" style="border-color:var(--bg)">
          <img src="https://i.pravatar.cc/80?img=25" class="w-10 h-10 rounded-full border-2 object-cover" style="border-color:var(--bg)">
          <img src="https://i.pravatar.cc/80?img=13" class="w-10 h-10 rounded-full border-2 object-cover" style="border-color:var(--bg)">
        </div>
        <div><div class="text-[color:var(--gold)] text-sm">★★★★★</div><div class="text-xs text-[color:var(--muted)]">+3.000 sorrisos transformados · nota 4,9 no Google</div></div>
      </div>
    </div>
    <div class="reveal frame"><img src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=900&q=80" alt="" class="w-full h-[540px] object-cover"></div>
  </header>

  <!-- TRUST BAR -->
  <section class="border-y border-[color:var(--line)]" style="background:#fff"><div class="container py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-sm">
    <div class="reveal"><div class="display brandtext text-4xl">+3 mil</div><div class="text-[color:var(--muted)] mt-1">pacientes atendidos</div></div>
    <div class="reveal"><div class="display brandtext text-4xl">+15 anos</div><div class="text-[color:var(--muted)] mt-1">de experiência</div></div>
    <div class="reveal"><div class="display brandtext text-4xl">4,9 ⭐</div><div class="text-[color:var(--muted)] mt-1">no Google</div></div>
    <div class="reveal"><div class="display brandtext text-4xl">12x</div><div class="text-[color:var(--muted)] mt-1">sem juros</div></div>
  </div></section>

  <!-- DORES -->
  <section class="container py-24">
    <div class="reveal max-w-2xl"><div class="kicker mb-6">A gente entende</div><h2 class="display text-5xl md:text-6xl">Já deixou de sorrir por causa dos dentes?</h2></div>
    <div class="grid md:grid-cols-3 gap-5 mt-14">
      <div class="reveal card p-8"><div class="text-3xl mb-3">😶</div><h3 class="text-xl font-bold serif">Vergonha de sorrir</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Evita fotos e cobre a boca pra falar. Dá pra mudar isso com um plano certo.</p></div>
      <div class="reveal card p-8"><div class="text-3xl mb-3">😨</div><h3 class="text-xl font-bold serif">Medo de dentista</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Aqui o atendimento é calmo, sem dor e com tudo explicado antes de começar.</p></div>
      <div class="reveal card p-8"><div class="text-3xl mb-3">💸</div><h3 class="text-xl font-bold serif">Acha que é caro</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Orçamento transparente e parcelado. Você sabe quanto vai pagar, sem surpresa.</p></div>
    </div>
  </section>

  <!-- TRATAMENTOS -->
  <section id="tratamentos" class="container py-24">
    <div class="reveal max-w-2xl"><div class="kicker mb-6">O que fazemos</div><h2 class="display text-5xl md:text-6xl">Tratamentos pra cada necessidade.</h2></div>
    <div class="grid md:grid-cols-3 gap-5 mt-14">
      <div class="reveal card p-8"><h3 class="serif text-2xl font-bold">Implantes</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Recupere dentes perdidos com firmeza e naturalidade. Volte a mastigar e sorrir sem medo.</p></div>
      <div class="reveal card p-8"><h3 class="serif text-2xl font-bold">Ortodontia / Alinhadores</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Aparelho fixo ou alinhador invisível pra deixar seus dentes alinhados com conforto.</p></div>
      <div class="reveal card p-8"><h3 class="serif text-2xl font-bold">Harmonização facial</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Realce sua beleza natural com procedimentos seguros e resultado equilibrado.</p></div>
      <div class="reveal card p-8"><h3 class="serif text-2xl font-bold">Clareamento</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Dentes mais brancos em poucas sessões, com segurança e sem sensibilidade.</p></div>
      <div class="reveal card p-8"><h3 class="serif text-2xl font-bold">Facetas / Lentes</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Desenhe o sorriso dos seus sonhos com facetas de porcelana sob medida.</p></div>
      <div class="reveal card p-8"><h3 class="serif text-2xl font-bold">Limpeza & prevenção</h3><p class="text-[color:var(--muted)] mt-3 leading-relaxed">Cuidado de rotina pra manter sua saúde bucal sempre em dia.</p></div>
    </div>
  </section>

  <!-- RESULTADOS / ANTES E DEPOIS -->
  <section id="resultados" class="container py-24">
    <div class="reveal max-w-2xl"><div class="kicker mb-6">Resultados reais</div><h2 class="display text-5xl md:text-6xl">Sorrisos que falam por si.</h2></div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-14">
      <div class="reveal frame"><img src="https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=500&q=80" class="w-full h-56 object-cover" alt=""></div>
      <div class="reveal frame"><img src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=500&q=80" class="w-full h-56 object-cover" alt=""></div>
      <div class="reveal frame"><img src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=500&q=80" class="w-full h-56 object-cover" alt=""></div>
      <div class="reveal frame"><img src="https://images.unsplash.com/photo-1581585504097-9a4d3cba8b59?w=500&q=80" class="w-full h-56 object-cover" alt=""></div>
    </div>
  </section>

  <!-- AUTORIDADE -->
  <section id="sobre" class="container py-24 grid lg:grid-cols-2 gap-16 items-center">
    <div class="reveal frame"><img src="https://images.unsplash.com/photo-1612277795421-9bc7706a4a34?w=800&q=80" alt="" class="w-full h-[520px] object-cover"></div>
    <div class="reveal">
      <div class="kicker mb-6">Quem cuida de você</div>
      <h2 class="display text-5xl md:text-6xl">Uma equipe que cuida<br>de gente, não de dentes.</h2>
      <p class="text-[color:var(--muted)] text-lg mt-6 leading-relaxed">[Conte sobre o(a) dentista responsável: formação, especialização, anos de experiência e o que torna o atendimento diferente.] Aqui cada paciente é único — e o plano de tratamento é pensado pra sua realidade e seu bolso.</p>
      <div class="hair my-8"></div>
      <div class="grid grid-cols-3 gap-6">
        <div><div class="display brandtext text-4xl">CRO</div><div class="text-xs text-[color:var(--muted)] mt-1">registro ativo</div></div>
        <div><div class="display brandtext text-4xl">+15</div><div class="text-xs text-[color:var(--muted)] mt-1">anos de clínica</div></div>
        <div><div class="display brandtext text-4xl">100%</div><div class="text-xs text-[color:var(--muted)] mt-1">higienização</div></div>
      </div>
    </div>
  </section>

  <!-- COMO FUNCIONA -->
  <section class="container py-24">
    <div class="reveal max-w-2xl mx-auto text-center"><div class="kicker mb-6 mx-auto">Simples e sem medo</div><h2 class="display text-5xl md:text-6xl">Seu tratamento em 3 passos.</h2></div>
    <div class="grid md:grid-cols-3 gap-5 mt-14">
      <div class="reveal card p-8"><div class="serif brandtext text-5xl">01</div><h3 class="serif text-2xl mt-3">Avaliação</h3><p class="text-[color:var(--muted)] mt-2 leading-relaxed">Você agenda pelo WhatsApp e fazemos um diagnóstico completo, sem compromisso.</p></div>
      <div class="reveal card p-8"><div class="serif brandtext text-5xl">02</div><h3 class="serif text-2xl mt-3">Plano + orçamento</h3><p class="text-[color:var(--muted)] mt-2 leading-relaxed">Apresentamos o plano de tratamento e o valor parcelado, tudo transparente.</p></div>
      <div class="reveal card p-8"><div class="serif brandtext text-5xl">03</div><h3 class="serif text-2xl mt-3">Seu novo sorriso</h3><p class="text-[color:var(--muted)] mt-2 leading-relaxed">Conduzimos cada etapa com cuidado até você sorrir com confiança de novo.</p></div>
    </div>
  </section>

  <!-- AVALIAÇÕES -->
  <section id="avaliacoes" class="container py-24">
    <div class="reveal max-w-2xl"><div class="kicker mb-6">Quem já sorriu com a gente</div><h2 class="display text-5xl md:text-6xl">Pacientes que recomendam.</h2></div>
    <div class="grid md:grid-cols-3 gap-5 mt-14">
      <div class="reveal card p-7"><div class="text-[color:var(--gold)] text-sm mb-3">★★★★★</div><p class="leading-relaxed">"Tinha pavor de dentista e fui super bem acolhida. Coloquei implante sem dor nenhuma e amei o resultado."</p><div class="flex items-center gap-3 mt-6"><img src="https://i.pravatar.cc/80?img=27" class="w-11 h-11 rounded-full object-cover"><div><div class="font-semibold">Sandra M.</div><div class="text-xs text-[color:var(--muted)]">Paciente · Google ✓</div></div></div></div>
      <div class="reveal card p-7"><div class="text-[color:var(--gold)] text-sm mb-3">★★★★★</div><p class="leading-relaxed">"Fiz as lentes e mudou minha autoestima. Atendimento nota 10 e parcelaram tudo certinho."</p><div class="flex items-center gap-3 mt-6"><img src="https://i.pravatar.cc/80?img=14" class="w-11 h-11 rounded-full object-cover"><div><div class="font-semibold">Rafael T.</div><div class="text-xs text-[color:var(--muted)]">Paciente · Google ✓</div></div></div></div>
      <div class="reveal card p-7"><div class="text-[color:var(--gold)] text-sm mb-3">★★★★★</div><p class="leading-relaxed">"Clínica linda, limpa e moderna. Explicaram tudo antes. Finalmente sorrio nas fotos sem travar."</p><div class="flex items-center gap-3 mt-6"><img src="https://i.pravatar.cc/80?img=49" class="w-11 h-11 rounded-full object-cover"><div><div class="font-semibold">Patrícia L.</div><div class="text-xs text-[color:var(--muted)]">Paciente · Google ✓</div></div></div></div>
    </div>
  </section>

  <!-- OFERTA -->
  <section class="container py-24">
    <div class="reveal card p-10 md:p-16 max-w-3xl mx-auto text-center relative overflow-hidden">
      <div class="kicker mb-6 mx-auto">Condição especial</div>
      <h2 class="display text-4xl md:text-5xl">Avaliação + raio-x: <span class="brandtext">gratuitos</span>.</h2>
      <p class="text-[color:var(--muted)] mt-5 max-w-md mx-auto">Agende sua avaliação esta semana e ganhe o diagnóstico completo sem custo. Vagas limitadas na agenda.</p>
      <ul class="text-left max-w-sm mx-auto space-y-3 mt-8">
        <li class="flex gap-3"><span class="brandtext">✓</span> Avaliação clínica completa</li>
        <li class="flex gap-3"><span class="brandtext">✓</span> Plano de tratamento personalizado</li>
        <li class="flex gap-3"><span class="brandtext">✓</span> Parcelamento em até 12x sem juros</li>
      </ul>
      <a href="https://wa.me/5511900000000" class="btn btn-wa mt-8 text-lg">Quero minha avaliação grátis →</a>
    </div>
  </section>

  <!-- GARANTIA -->
  <section class="container py-12"><div class="reveal card p-8 flex flex-col sm:flex-row items-center gap-6 max-w-3xl mx-auto" style="border:1px dashed var(--brand)">
    <div class="w-16 h-16 rounded-full flex items-center justify-center shrink-0 text-3xl" style="background:rgba(14,165,183,.12)">🦷</div>
    <div><h3 class="serif text-2xl font-bold">Compromisso com o seu sorriso</h3><p class="text-[color:var(--muted)] mt-1 leading-relaxed">Trabalhamos com materiais de qualidade e acompanhamento pós-tratamento. Qualquer ajuste necessário, a gente cuida — seu contentamento vem primeiro.</p></div>
  </div></section>

  <!-- FAQ -->
  <section id="faq" class="container py-24 max-w-3xl">
    <h2 class="reveal display text-5xl md:text-6xl mb-10 text-center">Perguntas frequentes</h2>
    <div class="reveal">
      <details class="faq"><summary>A avaliação é mesmo gratuita? <span class="pl">+</span></summary><p class="pb-5 text-[color:var(--muted)] leading-relaxed">Sim. A primeira avaliação e o diagnóstico são gratuitos e sem compromisso. Você só decide depois de saber o plano e o valor.</p></details>
      <details class="faq"><summary>Vou sentir dor? <span class="pl">+</span></summary><p class="pb-5 text-[color:var(--muted)] leading-relaxed">Nosso foco é o conforto. Usamos anestesia eficaz e técnicas modernas pra que você sinta o mínimo possível.</p></details>
      <details class="faq"><summary>Dá pra parcelar? <span class="pl">+</span></summary><p class="pb-5 text-[color:var(--muted)] leading-relaxed">Sim, parcelamos em até 12x sem juros no cartão, além de Pix e dinheiro com desconto.</p></details>
      <details class="faq"><summary>Atendem convênio? <span class="pl">+</span></summary><p class="pb-5 text-[color:var(--muted)] leading-relaxed">[Informe aqui se atende convênios e quais.] Também temos planos próprios facilitados.</p></details>
      <details class="faq"><summary>Quanto tempo demora o tratamento? <span class="pl">+</span></summary><p class="pb-5 text-[color:var(--muted)] leading-relaxed">Depende de cada caso — explicamos o tempo estimado já na avaliação, junto com o plano.</p></details>
      <details class="faq"><summary>Onde fica a clínica? <span class="pl">+</span></summary><p class="pb-5 text-[color:var(--muted)] leading-relaxed">[Endereço e bairro.] Fácil acesso e com estacionamento na região.</p></details>
    </div>
  </section>

  <!-- FORM -->
  <section id="agendar" class="container py-20">
    <div class="reveal max-w-xl mx-auto text-center"><div class="kicker mb-6 mx-auto">Agende sua avaliação</div><h2 class="display text-5xl md:text-6xl">Dê o primeiro passo.</h2><p class="text-[color:var(--muted)] mt-5">Preencha abaixo ou chame direto no WhatsApp. Retornamos rapidinho pra marcar seu melhor horário.</p></div>
    <form class="reveal card p-7 md:p-9 max-w-xl mx-auto mt-10 space-y-4" onsubmit="return false">
      <input class="field" placeholder="Seu nome">
      <input class="field" placeholder="WhatsApp (com DDD)">
      <textarea class="field" rows="3" placeholder="O que você gostaria de tratar?"></textarea>
      <a href="https://wa.me/5511900000000" class="btn btn-wa w-full text-lg">Agendar pelo WhatsApp →</a>
    </form>
  </section>

  <!-- FOOTER -->
  <footer class="border-t border-[color:var(--line)]" style="background:#fff">
    <div class="container py-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
      <div class="lg:col-span-2">
        <div class="flex items-center gap-3"><span class="mark">O</span><span class="serif text-xl font-semibold">[Sua Clínica]</span></div>
        <p class="text-sm text-[color:var(--muted)] mt-4 max-w-sm leading-relaxed">Odontologia humanizada e moderna em [sua cidade]. Cuidamos do seu sorriso com transparência e carinho.</p>
      </div>
      <div>
        <p class="text-xs font-bold uppercase tracking-wider mb-4">Navegação</p>
        <ul class="space-y-2 text-sm text-[color:var(--muted)]">
          <li><a href="#tratamentos" class="hover:text-[color:var(--ink)]">Tratamentos</a></li>
          <li><a href="#resultados" class="hover:text-[color:var(--ink)]">Resultados</a></li>
          <li><a href="#avaliacoes" class="hover:text-[color:var(--ink)]">Avaliações</a></li>
          <li><a href="#faq" class="hover:text-[color:var(--ink)]">FAQ</a></li>
        </ul>
      </div>
      <div>
        <p class="text-xs font-bold uppercase tracking-wider mb-4">Contato</p>
        <ul class="space-y-2 text-sm text-[color:var(--muted)]">
          <li>📍 [Endereço, bairro — cidade]</li>
          <li>📱 (11) 90000-0000</li>
          <li>🕒 Seg a Sex [09h–19h]</li>
        </ul>
      </div>
    </div>
    <div class="container pb-8"><div class="hair mb-6"></div><div class="flex flex-col sm:flex-row justify-between gap-3 text-xs text-[color:var(--muted)]"><span>© 2026 [Sua Clínica]. CRO [número].</span><span>Política de Privacidade · Termos</span></div></div>
  </footer>
</div>

<a href="https://wa.me/5511900000000" class="wa" target="_blank" rel="noreferrer"><span class="ic">●</span><span>Falar no WhatsApp</span></a>


`;
export const Route = createFileRoute("/")({ head: () => ({ meta: [ { title: "[Sua Clínica] — Odontologia que transforma sorrisos" } ] }), component: Index });
function Index(){
  useEffect(() => {
    const io=new IntersectionObserver((es)=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);}}),{threshold:0.12});
    document.querySelectorAll(".reveal").forEach((el)=>io.observe(el));
    const onScroll=()=>{const n=document.getElementById("nav"); if(n) n.classList.toggle("s", window.scrollY>20);};
    addEventListener("scroll", onScroll, {passive:true});
    return () => { io.disconnect(); removeEventListener("scroll", onScroll); };
  }, []);
  return (<><style dangerouslySetInnerHTML={{ __html: CSS }} /><div dangerouslySetInnerHTML={{ __html: BODY }} /></>);
}
