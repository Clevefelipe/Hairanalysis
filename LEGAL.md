# LEGAL - Hair Analysis System (H.A.S.)

## Declaracao de nao diagnostico clinico

- O Hair Analysis System e uma plataforma de inteligencia tecnica para decisao estetica capilar.
- O sistema nao realiza diagnostico clinico.
- O sistema nao prescreve tratamento medico.
- O sistema nao substitui avaliacao medica presencial.

## Termo de uso profissional

- O uso e destinado a profissionais habilitados no contexto estetico.
- A interpretacao das analises deve considerar avaliacao presencial do cliente.
- A escolha final de procedimento e de responsabilidade do profissional.

## Limitacao de responsabilidade

- O H.A.S. nao promete ausencia de risco.
- O H.A.S. nao determina procedimento obrigatorio.
- As saidas devem ser tratadas como apoio tecnico e nao como ordem de execucao.

## Obrigatoriedade de validacao humana

- Toda decisao final sobre alisamento, protocolo e cronograma deve ser validada por profissional responsavel.
- Em modo tricológico, recomendacoes de alisamento sao bloqueadas por governanca.
- Em baixa confiabilidade tecnica (`confidenceScore < 60`), a aptidao automatica e bloqueada e nova captura deve ser realizada.

## Governanca textual obrigatoria

- O sistema nao deve emitir determinacoes absolutas de procedimento.
- Formula de saida recomendada: "Apresenta aptidao estética para procedimentos de alisamento".
- A decisao final deve ser validada pelo profissional responsavel.
- Sanitizacao de termos clinicos obrigatoria em entradas e saidas com os seguintes mapeamentos minimos:
  - `cura` -> `cuidado estético`
  - `diagnéstico` -> `avaliação estética`
  - `alopecia` -> `queda acentuada percebida`
  - `dermatite` -> `sensibilidade aparente`
