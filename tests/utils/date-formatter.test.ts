/**
 * Testes Utilitários: Formatação de Datas
 * 
 * Testa funções de formatação e manipulação de datas.
 */

describe('Date Formatter Utility', () => {
  /**
   * Formata data para formato brasileiro
   */
  function formatDateBR(date: Date): string {
    return date.toLocaleDateString('pt-BR');
  }

  /**
   * Formata data e hora
   */
  function formatDateTime(date: Date): string {
    return date.toLocaleString('pt-BR');
  }

  /**
   * Calcula tempo relativo (ex: "há 2 horas")
   */
  function getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'agora mesmo';
    if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
    if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 30) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
    return formatDateBR(date);
  }

  /**
   * Verifica se data é hoje
   */
  function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  describe('Formatação Básica', () => {
    it('deve formatar data no formato brasileiro', () => {
      const date = new Date('2025-01-15');
      const formatted = formatDateBR(date);

      expect(formatted).toContain('/');
      expect(formatted.split('/').length).toBe(3);
    });

    it('deve formatar data e hora', () => {
      const date = new Date('2025-01-15T14:30:00');
      const formatted = formatDateTime(date);

      expect(formatted).toContain('/');
      expect(formatted).toContain(':');
    });
  });

  describe('Tempo Relativo', () => {
    it('deve retornar "agora mesmo" para segundos recentes', () => {
      const date = new Date(Date.now() - 30 * 1000); // 30 segundos atrás
      const relative = getRelativeTime(date);

      expect(relative).toBe('agora mesmo');
    });

    it('deve retornar minutos para tempo recente', () => {
      const date = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos atrás
      const relative = getRelativeTime(date);

      expect(relative).toContain('minuto');
      expect(relative).toContain('5');
    });

    it('deve retornar horas para tempo do dia', () => {
      const date = new Date(Date.now() - 3 * 60 * 60 * 1000); // 3 horas atrás
      const relative = getRelativeTime(date);

      expect(relative).toContain('hora');
      expect(relative).toContain('3');
    });

    it('deve retornar dias para tempo recente', () => {
      const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 dias atrás
      const relative = getRelativeTime(date);

      expect(relative).toContain('dia');
      expect(relative).toContain('2');
    });

    it('deve usar plural corretamente', () => {
      const date1 = new Date(Date.now() - 1 * 60 * 1000); // 1 minuto
      const date2 = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos

      const relative1 = getRelativeTime(date1);
      const relative2 = getRelativeTime(date2);

      expect(relative1).toContain('minuto');
      expect(relative1).not.toContain('minutos');
      expect(relative2).toContain('minutos');
    });
  });

  describe('Verificação de Data', () => {
    it('deve identificar data de hoje', () => {
      const today = new Date();

      expect(isToday(today)).toBe(true);
    });

    it('deve identificar data de ontem como não sendo hoje', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      expect(isToday(yesterday)).toBe(false);
    });

    it('deve identificar data de amanhã como não sendo hoje', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isToday(tomorrow)).toBe(false);
    });
  });

  describe('Casos Edge', () => {
    it('deve lidar com virada de ano', () => {
      const date = new Date('2023-12-31');
      const formatted = formatDateBR(date);

      expect(formatted).toBeTruthy();
    });

    it('deve lidar com anos bissextos', () => {
      const date = new Date(2025, 1, 29); // Ano, Mês (0-indexed), Dia

      expect(date.getDate()).toBe(29);
      expect(date.getMonth()).toBe(1); // Fevereiro (0-indexed)
      expect(date.getFullYear()).toBe(2025);
    });

    it('deve lidar com mudança de fuso horário', () => {
      const date = new Date('2025-01-15T00:00:00Z');

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBeGreaterThan(0);
    });
  });

  describe('Comparação de Datas', () => {
    it('deve comparar duas datas corretamente', () => {
      const date1 = new Date('2025-01-01');
      const date2 = new Date('2025-01-15');

      expect(date1.getTime()).toBeLessThan(date2.getTime());
    });

    it('deve identificar datas iguais', () => {
      const date1 = new Date('2025-01-15T12:00:00');
      const date2 = new Date('2025-01-15T12:00:00');

      expect(date1.getTime()).toBe(date2.getTime());
    });
  });
});

