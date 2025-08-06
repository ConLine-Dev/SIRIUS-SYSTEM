# Sistema de Avaliações Mensais do PDI-Hub - Análise Detalhada

## 📊 Visão Geral do Sistema

O sistema de avaliações mensais do PDI-Hub utiliza um modelo dinâmico e ponderado para calcular o desempenho dos colaboradores. O cálculo é inteligente e se adapta automaticamente quando novos fatores são adicionados.

## 🎯 Como Funciona o Cálculo das Médias

### 1. Cálculo Individual de Cada Avaliação Mensal

O sistema calcula a média de cada avaliação mensal usando **APENAS os fatores que foram preenchidos**. Isso significa que:

```javascript
// Código real do sistema (server/controllers/pdi-hub.js - linha 905-916)
answers.forEach(ans => {
    if (factorWeights[ans.factor_id] && scoreMap[ans.score]) {
        weightedSum += scoreMap[ans.score] * factorWeights[ans.factor_id];
        sumWeights += factorWeights[ans.factor_id];
    }
});

if (sumWeights > 0) {
    media = weightedSum / sumWeights;
}
```

### 2. Resposta à Sua Dúvida Principal

**❓ Pergunta:** "Se eu adicionar um novo fator e esse fator não for preenchido, o cálculo da média será com base nos fatores preenchidos ou dividido por todos?"

**✅ Resposta:** O cálculo é feito **APENAS com base nos fatores preenchidos**. 

Isso significa que:
- ✅ **A média NÃO cairá** quando você adicionar um novo fator
- ✅ Avaliações antigas manterão suas médias originais
- ✅ Apenas avaliações futuras que incluírem o novo fator terão ele considerado

## 📈 Estrutura do Sistema de Avaliação

### Tabelas Principais

1. **`pdi_factors`** - Fatores de avaliação disponíveis
   - `id`: Identificador único
   - `name`: Nome do fator (ex: "Assiduidade", "Produtividade")
   - `description`: Descrição detalhada
   - `default_weight`: Peso padrão (ex: 1.5, 1.8)

2. **`pdi_plan_factors`** - Fatores associados a cada PDI
   - `pdi_id`: ID do PDI
   - `factor_id`: ID do fator
   - `weight`: Peso específico para este PDI (pode sobrescrever o padrão)

3. **`pdi_monthly_evaluations`** - Avaliações mensais
   - `pdi_id`: ID do PDI
   - `month`: Mês da avaliação
   - `year`: Ano da avaliação
   - `comments`: Comentários do supervisor

4. **`pdi_evaluation_answers`** - Respostas de cada fator
   - `evaluation_id`: ID da avaliação
   - `factor_id`: ID do fator
   - `score`: Nota (Péssimo, Ruim, Regular, Bom, Ótimo)

## 🔢 Fórmula de Cálculo Detalhada

### Média Ponderada de Uma Avaliação

```
Média = Σ(Nota × Peso) / Σ(Pesos dos fatores respondidos)
```

### Exemplo Prático

**Cenário 1: Avaliação com 3 fatores (antes de adicionar novo fator)**

| Fator | Peso | Nota | Valor | Cálculo |
|-------|------|------|-------|---------|
| Assiduidade | 1.5 | Bom | 4 | 4 × 1.5 = 6.0 |
| Produtividade | 1.8 | Ótimo | 5 | 5 × 1.8 = 9.0 |
| Comunicação | 1.1 | Regular | 3 | 3 × 1.1 = 3.3 |

**Soma ponderada:** 18.3  
**Soma dos pesos:** 4.4  
**Média:** 18.3 ÷ 4.4 = **4.16**

**Cenário 2: Mesma avaliação após adicionar novo fator (não preenchido)**

| Fator | Peso | Nota | Valor | Cálculo |
|-------|------|------|-------|---------|
| Assiduidade | 1.5 | Bom | 4 | 4 × 1.5 = 6.0 |
| Produtividade | 1.8 | Ótimo | 5 | 5 × 1.8 = 9.0 |
| Comunicação | 1.1 | Regular | 3 | 3 × 1.1 = 3.3 |
| *Novo Fator* | *1.0* | *Não preenchido* | - | *Não entra no cálculo* |

**Soma ponderada:** 18.3  
**Soma dos pesos:** 4.4  
**Média:** 18.3 ÷ 4.4 = **4.16** ✅ (Mesma média!)

## 🎨 Sistema de Notas

O sistema converte avaliações qualitativas em valores numéricos:

```javascript
const scoreMap = { 
    'Ótimo': 5, 
    'Bom': 4, 
    'Regular': 3, 
    'Ruim': 2, 
    'Péssimo': 1 
};
```

## 📊 Média Geral do PDI

A média geral do PDI é calculada como a **média simples das médias mensais**:

```javascript
// Linha 200-202 do pdi-hub.js
const medias = evaluations.map(ev => typeof ev.media === 'number' ? ev.media : null)
                          .filter(m => m !== null);
const mediaGeral = medias.reduce((a, b) => a + b, 0) / medias.length;
```

## 🚀 Adicionando Novos Fatores - Fluxo Completo

### 1. Adicionar o Fator no Banco
```sql
INSERT INTO pdi_factors (name, description, default_weight, created_at) 
VALUES ('Inovação', 'Capacidade de propor novas ideias', 1.2, NOW());
```

### 2. Associar aos PDIs Existentes (Opcional)
```sql
-- Associar novo fator a todos os PDIs ativos
INSERT INTO pdi_plan_factors (pdi_id, factor_id, weight)
SELECT p.id, f.id, f.default_weight
FROM pdi_plans p
CROSS JOIN pdi_factors f
WHERE f.name = 'Inovação'
AND p.status = 'Ativo';
```

### 3. Comportamento Esperado
- ✅ PDIs existentes mantêm suas médias históricas
- ✅ Novas avaliações mostrarão o novo fator
- ✅ Supervisor pode escolher avaliar ou não o novo fator
- ✅ Média só considera fatores preenchidos

## 🔍 Verificação de Fatores Automática

O sistema tem uma verificação automática (linha 854-865):

```javascript
// Se não há fatores associados ao PDI, insere todos os fatores padrão
if (planFactors[0].total == 0) {
    const defaultFactors = await executeQuery('SELECT id, default_weight FROM pdi_factors');
    for (const factor of defaultFactors) {
        await executeQuery(
            'INSERT INTO pdi_plan_factors (pdi_id, factor_id, weight) VALUES (?, ?, ?)',
            [pdi_id, factor.id, factor.default_weight]
        );
    }
}
```

## 📌 Pontos Importantes

### Vantagens do Sistema Atual

1. **Flexibilidade**: Novos fatores não afetam avaliações antigas
2. **Justiça**: Médias históricas permanecem consistentes
3. **Adaptabilidade**: Cada PDI pode ter fatores e pesos diferentes
4. **Robustez**: Sistema não quebra com dados faltantes

### Considerações

1. **Peso dos Fatores**: Fatores mais importantes têm peso maior
2. **Avaliações Parciais**: É possível avaliar apenas alguns fatores
3. **Histórico Preservado**: Mudanças não afetam retroativamente

## 💡 Recomendações

### Ao Adicionar Novos Fatores

1. **Comunicar**: Informe supervisores sobre o novo fator
2. **Documentar**: Explique o que o fator avalia
3. **Peso Adequado**: Defina um peso que reflita a importância
4. **Gradual**: Considere tornar opcional inicialmente

### Boas Práticas

1. **Consistência**: Mantenha avaliações regulares
2. **Feedback**: Use comentários para contextualizar notas
3. **Revisão**: Periodicamente revise os fatores e pesos
4. **Treinamento**: Garanta que supervisores entendam cada fator

## 🛠️ Exemplo de Query para Análise

### Ver Média de um PDI com Detalhes
```sql
SELECT 
    e.month,
    e.year,
    COUNT(ea.factor_id) as fatores_avaliados,
    AVG(CASE ea.score 
        WHEN 'Ótimo' THEN 5 
        WHEN 'Bom' THEN 4 
        WHEN 'Regular' THEN 3 
        WHEN 'Ruim' THEN 2 
        WHEN 'Péssimo' THEN 1 
    END) as media_simples
FROM pdi_monthly_evaluations e
LEFT JOIN pdi_evaluation_answers ea ON e.id = ea.evaluation_id
WHERE e.pdi_id = ?
GROUP BY e.id, e.month, e.year
ORDER BY e.year DESC, e.month DESC;
```

## 📝 Conclusão

O sistema de avaliações do PDI-Hub é **inteligente e adaptativo**. Ele foi projetado para:
- Não penalizar avaliações antigas quando novos fatores são adicionados
- Calcular médias justas baseadas apenas no que foi avaliado
- Permitir evolução contínua dos critérios de avaliação
- Manter consistência histórica

**Resposta Final:** Pode adicionar novos fatores sem preocupação - as médias existentes **NÃO serão afetadas** negativamente! 🎉 