const { executeQuery } = require('../connect/mysql');
const { executeQuerySQL } = require('../connect/sqlServer');
const fs = require('fs');
const path = require('path');

const commercialMain = {

    totalProcesses: async function () {

        let result = await executeQuerySQL(`
            SELECT
                DATEPART(MONTH, Lhs.Data_Abertura_Processo) AS Mes,
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-LCL'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-LCL'
                END AS Tipo_Processo,
                COUNT(*) AS Quantidade
            FROM
                mov_Logistica_House Lhs
            JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Maritima_House Lmh on Lmh.IdLogistica_House = Lhs.IdLogistica_House
            LEFT OUTER JOIN
                mov_Projeto_Atividade_Responsavel Iss on Iss.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Iss.IdPapel_Projeto = 12)
            LEFT OUTER JOIN
                mov_Projeto_Atividade_Responsavel Sls on Sls.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Sls.IdPapel_Projeto = 3)
            WHERE
                DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2025
                AND Lhs.Situacao_Agenciamento NOT IN (7 /* CANCELADO */)
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
            GROUP BY
                DATEPART(MONTH, Lhs.Data_Abertura_Processo),
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-LCL'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-LCL'
                END
            ORDER BY
                Mes, Tipo_Processo`);

        return result;
    },

    clientsDetails: async function () {

        let result = await executeQuerySQL(`
            SELECT
                cli.nome AS Nome,
                COUNT(DISTINCT lhs.Numero_Processo) AS Total_Processos,
                COALESCE(SUM(lmh.Total_TEUS), 0) AS Total_TEUS,
                SUM(DISTINCT lma.Lucro_Estimado) AS Lucro_Estimado,
                MAX(FORMAT(lvm.Data_Embarque, 'dd/MM/yyyy')) AS Ultimo_Embarque
            FROM
                mov_logistica_house lhs
                LEFT OUTER JOIN
                    mov_Logistica_master lmr ON lmr.IdLogistica_Master = lhs.IdLogistica_Master
                LEFT OUTER JOIN
                    cad_pessoa cli ON cli.IdPessoa = lhs.IdCliente
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_House lmh ON lmh.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Moeda lma ON lma.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Viagem lvm ON lvm.IdLogistica_House = lhs.IdLogistica_House
            WHERE
                YEAR(lvm.Data_Embarque) = 2025
                AND lma.idmoeda IN (110)
            GROUP BY
                cli.nome`);

        return result;
    },

    activeClients: async function () {

        let result = await executeQuerySQL(`
            WITH ProcessosOrdenados AS (
                SELECT
                    cli.nome AS Nome,
                    lhs.IdCliente,
                    lhs.Data_Abertura_Processo,
                    lms.Tipo_Operacao,
                    lhs.Tipo_Carga,
                    lms.IdCompanhia_Transporte,
                    ROW_NUMBER() OVER (
                        PARTITION BY lhs.IdCliente
                        ORDER BY lhs.Data_Abertura_Processo DESC
                    ) AS rn
                FROM
                    mov_logistica_house lhs
                LEFT JOIN cad_pessoa cli ON cli.IdPessoa = lhs.IdCliente
                LEFT JOIN mov_Logistica_Master lms ON lms.IdLogistica_Master = lhs.IdLogistica_Master
                WHERE
                    YEAR(lhs.Data_Abertura_Processo) = YEAR(GETDATE())
            )
            SELECT
                Nome,
                IdCliente,
                Data_Abertura_Processo AS DataMaisRecente,
                MONTH(Data_Abertura_Processo) AS Mes,
                CASE
                    WHEN Tipo_Carga = 1 AND Tipo_Operacao = 2 AND IdCompanhia_Transporte IN (88, 49339, 58828) THEN 'IA-COURIER'
                    WHEN Tipo_Carga = 1 AND Tipo_Operacao = 2 THEN 'IA-NORMAL'
                    WHEN Tipo_Carga = 3 AND Tipo_Operacao = 2 THEN 'IM-FCL'
                    WHEN Tipo_Carga = 4 AND Tipo_Operacao = 2 THEN 'IM-LCL'
                    WHEN Tipo_Carga = 1 AND Tipo_Operacao = 1 AND IdCompanhia_Transporte IN (88, 49339, 58828) THEN 'EA-COURIER'
                    WHEN Tipo_Carga = 1 AND Tipo_Operacao = 1 THEN 'EA-NORMAL'
                    WHEN Tipo_Carga = 3 AND Tipo_Operacao = 1 THEN 'EM-FCL'
                    WHEN Tipo_Carga = 4 AND Tipo_Operacao = 1 THEN 'EM-LCL'
                END AS Tipo_Processo
            FROM
                ProcessosOrdenados
            WHERE
                rn = 1
            ORDER BY
                Mes;`);

        return result;
    },

    newClients: async function () {

        let result = await executeQuerySQL(`
            WITH PrimeirosProcessos AS (
                SELECT
                    cli.nome AS Nome,
                    lhs.IdCliente,
                    lhs.Data_Abertura_Processo,
                    DATEPART(month, lhs.Data_Abertura_Processo) AS Mes,
                    CASE
                        WHEN Lhs.Tipo_Carga = 1 AND Lms.Tipo_Operacao = 2 AND Lms.IdCompanhia_Transporte IN (88, 49339, 58828) THEN 'IA-COURIER'
                        WHEN Lhs.Tipo_Carga = 1 AND Lms.Tipo_Operacao = 2 AND Lms.IdCompanhia_Transporte NOT IN (88, 49339, 58828) THEN 'IA-NORMAL'
                        WHEN Lhs.Tipo_Carga = 3 AND Lms.Tipo_Operacao = 2 THEN 'IM-FCL'
                        WHEN Lhs.Tipo_Carga = 4 AND Lms.Tipo_Operacao = 2 THEN 'IM-LCL'
                        WHEN Lhs.Tipo_Carga = 1 AND Lms.Tipo_Operacao = 1 AND Lms.IdCompanhia_Transporte IN (88, 49339, 58828) THEN 'EA-COURIER'
                        WHEN Lhs.Tipo_Carga = 1 AND Lms.Tipo_Operacao = 1 AND Lms.IdCompanhia_Transporte NOT IN (88, 49339, 58828) THEN 'EA-NORMAL'
                        WHEN Lhs.Tipo_Carga = 3 AND Lms.Tipo_Operacao = 1 THEN 'EM-FCL'
                        WHEN Lhs.Tipo_Carga = 4 AND Lms.Tipo_Operacao = 1 THEN 'EM-LCL'
                    END AS Tipo_Processo,
                    ROW_NUMBER() OVER (PARTITION BY lhs.IdCliente ORDER BY lhs.Data_Abertura_Processo ASC) AS rn
                FROM
                    mov_logistica_house lhs
                    LEFT JOIN cad_pessoa cli ON cli.IdPessoa = lhs.IdCliente
                    LEFT JOIN mov_Logistica_Master lms ON lms.IdLogistica_Master = lhs.IdLogistica_Master
            )
            SELECT
                Nome,
                IdCliente,
                Data_Abertura_Processo AS PrimeiraData,
                Mes,
                Tipo_Processo
            FROM
                PrimeirosProcessos
            WHERE
                rn = 1
                AND DATEPART(YEAR, Data_Abertura_Processo) = DATEPART(YEAR, GETDATE())
            ORDER BY Mes`);

        return result;
    },

    teusAndProfit: async function () {

        let result = await executeQuerySQL(`
            SELECT
                lhs.Numero_Processo,
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-LCL'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-LCL'
                END AS Tipo_Processo,
                DATEPART(month, lhs.Data_Abertura_Processo) AS Mes,
                COALESCE(lmh.Total_TEUS, 0) AS Total_TEUS,
                COALESCE(lmh.Total_Container_20, 0) AS Total_Container_20,
                COALESCE(lmh.Total_Container_40, 0) AS Total_Container_40,
                SUM(DISTINCT lma.Lucro_Estimado) AS Lucro_Estimado
            FROM
                mov_logistica_house lhs
                LEFT OUTER JOIN
                    mov_Logistica_master lms ON lms.IdLogistica_Master = lhs.IdLogistica_Master
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_House lmh ON lmh.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Moeda lma ON lma.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Viagem lvm ON lvm.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_logistica_maritima_equipamento lme ON lme.idlogistica_house = lhs.idlogistica_house
                LEFT OUTER JOIN
                    cad_equipamento_maritimo emo ON emo.idequipamento_maritimo = lme.idequipamento_maritimo
            WHERE
                YEAR(lhs.Data_Abertura_Processo) = 2025
                AND lhs.Numero_Processo NOT LIKE '%test%'
                AND lhs.Numero_Processo NOT LIKE '%demu%'
                AND lma.idmoeda IN (110)
            GROUP BY
                lhs.Numero_Processo,
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-LCL'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-LCL'
                END,
                DATEPART(month, lhs.Data_Abertura_Processo),
                lmh.Total_TEUS,
                lmh.Total_Container_20,
                lmh.Total_Container_40`);

        return result;
    },

    teusAndProfitByUser: async function (userId) {

        let result = await executeQuerySQL(`
            SELECT
                lhs.Numero_Processo,
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-LCL'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-LCL'
                END AS Tipo_Processo,
                DATEPART(month, lhs.Data_Abertura_Processo) AS Mes,
                COALESCE(lmh.Total_TEUS, 0) AS Total_TEUS,
                COALESCE(lmh.Total_Container_20, 0) AS Total_Container_20,
                COALESCE(lmh.Total_Container_40, 0) AS Total_Container_40,
                SUM(DISTINCT lma.Lucro_Estimado) AS Lucro_Estimado
            FROM
                mov_logistica_house lhs
                LEFT OUTER JOIN
                    mov_Logistica_master lms ON lms.IdLogistica_Master = lhs.IdLogistica_Master
                LEFT OUTER JOIN
                    mov_Logistica_Maritima_House lmh ON lmh.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Moeda lma ON lma.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_Logistica_Viagem lvm ON lvm.IdLogistica_House = lhs.IdLogistica_House
                LEFT OUTER JOIN
                    mov_logistica_maritima_equipamento lme ON lme.idlogistica_house = lhs.idlogistica_house
                LEFT OUTER JOIN
                    cad_equipamento_maritimo emo ON emo.idequipamento_maritimo = lme.idequipamento_maritimo
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Iss on Iss.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Iss.IdPapel_Projeto = 12)
                LEFT OUTER JOIN
                    mov_Projeto_Atividade_Responsavel Sls on Sls.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Sls.IdPapel_Projeto = 3)
            WHERE
                YEAR(lhs.Data_Abertura_Processo) = 2025
                AND lhs.Numero_Processo NOT LIKE '%test%'
                AND lhs.Numero_Processo NOT LIKE '%demu%'
                AND lma.idmoeda IN (110)
                AND (Iss.IdResponsavel = ${userId} OR Sls.IdResponsavel = ${userId})
            GROUP BY
                lhs.Numero_Processo,
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-LCL'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-LCL'
                END,
                DATEPART(month, lhs.Data_Abertura_Processo),
                lmh.Total_TEUS,
                lmh.Total_Container_20,
                lmh.Total_Container_40`);

        return result;
    },

    processesByUser: async function (userId) {

        let result = await executeQuerySQL(`
            SELECT
                DATEPART(MONTH, Lhs.Data_Abertura_Processo) AS Mes,
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-LCL'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-LCL'
                END AS Tipo_Processo,
                COUNT(*) AS Quantidade
            FROM
                mov_Logistica_House Lhs
            JOIN
                mov_Logistica_Master Lms ON Lms.IdLogistica_Master = Lhs.IdLogistica_Master
            LEFT OUTER JOIN
                mov_Logistica_Maritima_House Lmh on Lmh.IdLogistica_House = Lhs.IdLogistica_House
            LEFT OUTER JOIN
                mov_Projeto_Atividade_Responsavel Iss on Iss.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Iss.IdPapel_Projeto = 12)
            LEFT OUTER JOIN
                mov_Projeto_Atividade_Responsavel Sls on Sls.IdProjeto_Atividade = Lhs.IdProjeto_Atividade and (Sls.IdPapel_Projeto = 3)
            WHERE
                DATEPART(YEAR, Lhs.Data_Abertura_Processo) = 2025
                AND Lhs.Situacao_Agenciamento NOT IN (7 /* CANCELADO */)
                AND Lhs.Numero_Processo NOT LIKE '%test%'
                AND Lhs.Numero_Processo NOT LIKE '%DEMU%'
                AND (Iss.IdResponsavel = ${userId} OR Sls.IdResponsavel = ${userId})
            GROUP BY
                DATEPART(MONTH, Lhs.Data_Abertura_Processo),
                CASE
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 2 /* IMPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'IA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 2 /* IMPO */ THEN 'IM-LCL'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-COURIER'
                    WHEN Lhs.Tipo_Carga = 1 /* Aéreo */ AND Lms.Tipo_Operacao = 1 /* EXPO */
                        AND Lms.IdCompanhia_Transporte NOT IN (88 /*FEDEX*/, 49339 /*DHL*/, 58828 /*UPS*/) THEN 'EA-NORMAL'
                    WHEN Lhs.Tipo_Carga = 3 /* FCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-FCL'
                    WHEN Lhs.Tipo_Carga = 4 /* LCL */ AND Lms.Tipo_Operacao = 1 /* EXPO */ THEN 'EM-LCL'
                END
            ORDER BY
                Mes, Tipo_Processo`);

        return result;
    }
};

module.exports = {
    commercialMain,
};
