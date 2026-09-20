import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import SubNavbar from './SubNavbar';

describe('SubNavbar', () => {
  it('renderiza categorías y ejecuta la selección', () => {
    render(
      <MemoryRouter>
        <SubNavbar categorias={[{ id: 1, nombre: 'Celulares' }]} />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole('button', { name: /categorías/i }));
    expect(screen.getByText('Celulares')).toHaveAttribute('href', '#categoria-1');
  });
});
