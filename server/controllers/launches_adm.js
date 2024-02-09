const { executeQuerySQL } = require('../connect/sqlServer');


const launches_adm = {
    getAllLaunches: async function(){
    const result = await executeQuerySQL(`select ffc.Data_Vencimento as 'Data_Vencimento'
    , case ffc.Situacao
    when 1 then 'Em aberto'
    when 2 then 'Quitada'
    when 3 then 'Parcialmente quitada'
    when 4 then 'Unificada'
    when 5 then 'Em cobrança'
    when 7 then 'Em combrança judicial'
    when 8 then 'Negativado'
    when 9 then 'Protestado'
    when 10 then 'Junk'
    when 6 then 'Cancelada' 
    end as 'Situacao'
    , ffc.Historico_Resumo
    , pss.Nome as 'Pessoa'
    , ttc.Nome as 'Tipo_Transacao'
    from mov_Fatura_Financeira ffc
    
    join mov_Registro_Financeiro rfc on rfc.IdRegistro_Financeiro = ffc.IdRegistro_Financeiro
    join cad_Pessoa pss on pss.IdPessoa = rfc.IdPessoa
    join cad_Tipo_Transacao ttc on ttc.IdTipo_Transacao = rfc.IdTipo_Transacao`);
    
    // Mapear os resultados e formatar a data
    const resultadosFormatados = result.map(item => ({
        'Data_Vencimento': '<span style="display:none">'+new Date(item.Data_Vencimento).toISOString().split('T')[0]+'</span>'+new Date(item.Data_Vencimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }),
        'Situacao': item.Situacao,
        'Historico_Resumo': item.Historico_Resumo,
        'Pessoa': item.Pessoa,
        'Tipo_Transacao': item.Tipo_Transacao
    }));

    const format = {
        "data": resultadosFormatados
    }



    return format;
    }
}



module.exports = {
    launches_adm,
};