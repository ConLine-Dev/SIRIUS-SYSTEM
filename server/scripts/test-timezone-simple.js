/**
 * Script simples para testar a correção do fuso horário
 */
function testTimezoneCorrection() {
  console.log('🧪 Teste Simples de Correção de Fuso Horário');
  console.log('=' .repeat(50));
  
  const now = new Date();
  const nowLocal = new Date(now.getTime() - (3 * 60 * 60000)); // Subtrair 3 horas
  
  console.log('📅 Horários:');
  console.log(`   - Agora (UTC): ${now.toISOString()}`);
  console.log(`   - Agora (Local): ${now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`   - Agora (Local UTC-3): ${nowLocal.toISOString()}`);
  
  // Teste com horário específico
  const testTime = new Date('2025-08-26T11:38:00.000Z');
  const testTimeLocal = new Date(testTime.getTime() - (3 * 60 * 60000));
  
  console.log('\n⏰ Teste com horário específico:');
  console.log(`   - Original: 2025-08-26T11:38:00.000Z`);
  console.log(`   - Local (UTC-3): ${testTimeLocal.toISOString()}`);
  console.log(`   - Deveria ser: 2025-08-26T08:38:00.000Z`);
  
  // Verificar se está correto
  const isCorrect = testTimeLocal.toISOString() === '2025-08-26T08:38:00.000Z';
  console.log(`\n✅ Correção está ${isCorrect ? 'CORRETA' : 'INCORRETA'}`);
  
  if (isCorrect) {
    console.log('🎯 O fuso horário está sendo calculado corretamente!');
  } else {
    console.log('❌ Ainda há problemas no cálculo do fuso horário');
  }
}

// Executar teste
testTimezoneCorrection(); 