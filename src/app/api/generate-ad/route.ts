import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt: userPrompt } = await req.json()
    if (!imageUrl) {
      return NextResponse.json({ error: 'Missing imageUrl' }, { status: 400 })
    }

    // Step 1: Fetch the image submitted by the user
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to fetch image')
    }
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageBase64 = Buffer.from(imageBuffer).toString('base64')

    // Step 2: Generate video with Veo 3.0 using the image
    const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY })
    const prompt = userPrompt || 'Make the stunning ad of the product with the image price and description'
    let operation = await ai.models.generateVideos({
      model: 'veo-3.0-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imageBase64,
        mimeType: imageResponse.headers.get('content-type') || 'image/png',
      },
    })

    // Poll the operation status until the video is ready
    while (!operation.done) {
      console.log('Waiting for video generation to complete...')
      await new Promise((resolve) => setTimeout(resolve, 10000))
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      })
    }

    // Download the video (get the base64 video string)
    if (!operation.response?.generatedVideos?.[0]?.video) {
      throw new Error('Failed to generate video')
    }
    const videoData = operation.response.generatedVideos[0].video
    const videoBuffer = Buffer.from(videoData as string, 'base64')

    // Upload video to Supabase
    const fileName = `product-videos/${Math.random().toString(36).substring(2)}.mp4`
    const { data, error } = await supabase.storage
      .from('videos')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        cacheControl: '3600',
        upsert: false,
      })
    if (error) {
      throw new Error(`Failed to upload video: ${error.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('videos')
      .getPublicUrl(fileName)

    return NextResponse.json({ videoUrl: publicUrl })
  } catch (error) {
    console.error('Error generating ad:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}