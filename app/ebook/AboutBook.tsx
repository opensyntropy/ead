// Texto descritivo do livro — dá ao Google conteúdo sobre o tema além da copy de venda.
export default function AboutBook() {
  return (
    <section id="sobre-o-livro" className="py-24 px-6 bg-white">
      <div className="max-w-3xl mx-auto">
        <p className="uppercase tracking-[0.2em] text-sm font-semibold mb-4 text-[#7C3A5B]">Sobre o livro</p>
        <h2 className="font-medium leading-tight mb-8 text-[#2B1A15]" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
          Um livro de agrofloresta sintrópica do porquê ao como.
        </h2>

        <div className="flex flex-col gap-5 text-lg leading-relaxed text-gray-700">
          <p>
            O <strong>Guia de Introdução à Agrofloresta Sintrópica</strong> é um livro digital (ebook em PDF) de 207 páginas
            que explica, de ponta a ponta, como funciona a agricultura sintrópica desenvolvida por Ernst Götsch: da lógica da
            floresta aos modelos de sistema agroflorestal (SAF) e à implantação na sua terra.
          </p>
          <p>
            A maior parte do material sobre agrofloresta está espalhada em cursos, vídeos e apostilas que presumem que você
            já sabe o básico. Este livro foi escrito para ser o fio condutor que faltava: começa pelos fundamentos
            (sintropia, sucessão natural, estratos, consórcios e poda), passa por solo e fertilidade (biomassa, relação C/N,
            gramíneas e adubação verde), chega ao planejamento (leitura da paisagem, objetivos, espécies de serviço e arranjo
            das linhas) e termina na prática, com os modelos de SAF e os primeiros 12 meses de implantação.
          </p>
          <p>
            São 27 capítulos organizados em 5 partes, com mais de 25 infográficos que transformam os conceitos em imagens:
            o calendário da sucessão, a arquitetura dos estratos e o desenho das linhas de plantio.
          </p>
        </div>

        <h3 className="font-medium text-2xl mt-12 mb-4 text-[#2B1A15]">Para quem é este livro</h3>
        <ul className="flex flex-col gap-3 text-lg text-gray-700 list-disc pl-6">
          <li>Quem está em transição para o campo e quer entender agrofloresta antes de comprar terra ou mudas.</li>
          <li>Quem já tem um sítio e não sabe por onde começar um sistema agroflorestal.</li>
          <li>Quem fez um curso de agrofloresta e quer um material de referência para consultar ao longo dos anos.</li>
          <li>Estudantes, técnicos e educadores que buscam um panorama organizado da agricultura sintrópica em português.</li>
        </ul>

        <h3 className="font-medium text-2xl mt-12 mb-4 text-[#2B1A15]">Sobre o autor</h3>
        <p className="text-lg leading-relaxed text-gray-700">
          Michel Bottan fez a formação de professores em agricultura sintrópica com Ernst Götsch em 2016 e desde então
          constrói o Desperto, um sítio agroflorestal em Caçapava (SP) que funciona como escola e laboratório. Tem formação
          em Design em Restauração de Ecossistemas pela Gaia Education e fundou a OpenSyntropy, que desenvolve tecnologia
          para a agricultura regenerativa. <a href="/sobre" className="font-bold text-[#7C3A5B] hover:underline">Conheça o autor →</a>
        </p>
      </div>
    </section>
  )
}
