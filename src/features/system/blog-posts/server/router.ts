import { z } from "zod";

import {
  baseProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "@/integrations/trpc/init";
import {
  createBlogPost,
  deleteBlogPost,
  publishBlogPost,
  unpublishBlogPost,
  updateBlogPost,
} from "./mutations";
import {
  getBlogPostById,
  getPublishedBlogPostBySlug,
  listBlogPosts,
  listPublishedBlogPosts,
} from "./queries";
import {
  blogPostMutationSchema,
  blogPostUpdateSchema,
  listBlogPostsInput,
} from "./schemas";

export const blogPostsRouter = createTRPCRouter({
  publicList: baseProcedure.query(({ ctx }) => listPublishedBlogPosts(ctx)),
  publicGetBySlug: baseProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) => getPublishedBlogPostBySlug(ctx, input.slug)),
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(({ ctx, input }) => getBlogPostById(ctx, input.id)),
  list: protectedProcedure
    .input(listBlogPostsInput)
    .query(({ ctx, input }) => listBlogPosts(ctx, input)),
  create: protectedProcedure
    .input(blogPostMutationSchema)
    .mutation(({ ctx, input }) => createBlogPost(ctx, input)),
  update: protectedProcedure
    .input(blogPostUpdateSchema)
    .mutation(({ ctx, input }) => updateBlogPost(ctx, input)),
  publish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => publishBlogPost(ctx, input.id)),
  unpublish: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => unpublishBlogPost(ctx, input.id)),
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(({ ctx, input }) => deleteBlogPost(ctx, input.id)),
});
