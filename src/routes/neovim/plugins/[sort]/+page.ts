import { trpc } from '$lib/trpc/client';
import { error } from '@sveltejs/kit';
import { z } from 'zod';
import type { PageLoad, PageLoadEvent } from './$types';

const content = {
  new: {
    title: 'New Neovim Plugins',
    description: 'The newest Neovim plugins on Dotfyle',
    ogTitle: `What are the newest Neovim plugins in ${new Date().getFullYear()}?`,
    ogDescription: `Learn about the newest Neovim plugins in ${new Date().getFullYear()}.`
  },
  popular: {
    title: 'Top Neovim Plugins',
    description: 'The most popular Neovim plugins on Dotfyle',
    ogTitle: `What are the most popular Neovim plugins in ${new Date().getFullYear()}?`,
    ogDescription: `Learn about the most popular Neovim plugins in ${new Date().getFullYear()}.`
  },
  trending: {
    title: 'Trending Neovim Plugins',
    description: 'Trending Neovim plugins on Dotfyle today',
    ogTitle: `What are the trending Neovim plugins in ${new Date().getFullYear()}?`,
    ogDescription: `Learn about trending Neovim plugins in ${new Date().getFullYear()}.`
  }
} as const;

const getPage = (event: PageLoadEvent) => {
  const rawPage = event.url.searchParams.get('page') ?? '';
  const page = parseInt(rawPage, 10);
  return isNaN(page) ? 1 : page;
};

const getSorting = (event: PageLoadEvent) => {
  const { sort } = event.params;
  try {
    const sorting = z.enum(['new', 'top', 'popular', 'trending']).parse(sort);
    switch (sorting) {
      case 'top':
        return 'popular';
      default:
        return sorting;
    }
  } catch {
    throw error(404);
  }
};

export const load: PageLoad = async function load(event: PageLoadEvent) {
  const query = event.url.searchParams.get('q') ?? undefined;

  const selectedCategories =
    event.url.searchParams.get('categories')?.split(',').filter(Boolean) ?? [];

  const sorting = getSorting(event);

  const [res, categories] = await Promise.all([
    trpc(event).searchPlugins.query({
      query,
      sorting,
      categories: selectedCategories,
      page: getPage(event)
    }),
    trpc(event).listPluginCategories.query()
  ]);

  return {
    plugins: res.data,
    pagination: res.meta,
    categories,
    content: content[sorting],
    navigation: [ 'Trending', 'Top', 'New'].map((label) => {
      const value = label.toLowerCase();
      return {
        label,
        value,
        path: `/neovim/plugins/${value}`
      };
    })
  };
};