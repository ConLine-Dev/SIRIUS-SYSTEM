# Active Context: SIRIUS-SYSTEM

## Current Work Focus

*   Correção de sincronização de versões no módulo `procedures-management`
*   Otimização do sistema de cache para garantir dados sempre atualizados

## Recent Changes

*   **Procedures Management - Correção de Sincronização de Versões**:
    - Adicionado cache específico por procedimento no backend
    - Implementada invalidação de cache após operações (create, update, delete, revert)
    - Adicionado flag no sessionStorage para forçar refresh após edição
    - Implementados listeners WebSocket para sincronização em tempo real
    - Headers HTTP anti-cache nas requisições críticas
    - Pequeno delay após commit para garantir sincronização do MySQL

*   **Documentação**:
    - Criado `VERSION_SYNC_FIX.md` documentando a solução completa

## Next Steps

*   Testar a correção em diferentes cenários:
    - Múltiplas abas abertas
    - Diferentes usuários simultâneos
    - Procedimentos com conteúdo grande (imagens)
*   Monitorar logs para verificar eficácia da solução
*   Considerar aplicar padrão similar em outros módulos se necessário

## Active Decisions and Considerations

*   **Cache Strategy**: Mantendo cache para performance mas com invalidação inteligente
*   **Real-time Sync**: WebSockets garantem sincronização entre usuários
*   **Fallback Options**: Parâmetro `?refresh=true` disponível como alternativa
*   **MySQL Timing**: Delay de 100ms após commit para garantir sincronização 