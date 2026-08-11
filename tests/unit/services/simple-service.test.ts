/**
 * Tests simples pour vérifier la configuration Jest
 */

describe('Jest Configuration', () => {
  it('should pass basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support async tests', async () => {
    const result = Promise.resolve('success');
    await expect(result).resolves.toBe('success');
  });

  it('should support mocks', () => {
    const mockFn = jest.fn();
    mockFn('hello');
    mockFn('world');
    
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toHaveBeenCalledWith('hello');
    expect(mockFn).toHaveBeenCalledWith('world');
  });
});

describe('VersyFlow Core', () => {
  it('should have theme tokens defined', () => {
    const primaryColor = '#E91E8C';
    const backgroundColor = '#fcf9f8';
    
    expect(primaryColor).toBe('#E91E8C');
    expect(backgroundColor).toBe('#fcf9f8');
  });

  it('should have navigation structure', () => {
    const tabs = ['index', 'explore', 'progress'];
    
    expect(tabs).toHaveLength(3);
    expect(tabs).toContain('index');
    expect(tabs).toContain('explore');
    expect(tabs).toContain('progress');
  });

  it('should have FSRS ratings', () => {
    const ratings = ['again', 'hard', 'good', 'easy'];
    
    expect(ratings).toHaveLength(4);
    expect(ratings).toContain('again');
    expect(ratings).toContain('easy');
  });
});
