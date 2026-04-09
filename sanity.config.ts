import { defineConfig } from 'sanity'
import { visionTool } from '@sanity/vision'
import { structureTool } from 'sanity/structure'
import { deskStructure } from './src/sanity/deskStructure'
import { schema } from './src/sanity/schema'

export default defineConfig({
    name: 'default',
    title: 'Luximport Shop',

    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string,
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET as string,

    basePath: '/studio',

    plugins: [structureTool({ structure: deskStructure }), visionTool()],

    schema: {
        types: schema.types, 
    },
})
