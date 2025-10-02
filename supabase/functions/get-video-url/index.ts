import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { lessonId } = await req.json()

    if (!lessonId) {
      console.error('Missing lessonId in request')
      return new Response(
        JSON.stringify({ error: 'Lesson ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      console.error('Missing authorization header')
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Creating Supabase client with auth header')

    // Create Supabase client - use the service role for auth verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    )

    // Verify user is authenticated by extracting JWT
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    console.log('Auth check result:', { hasUser: !!user, userError: userError?.message })
    
    if (userError || !user) {
      console.error('User authentication failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('User authenticated:', user.id)

    // Fetch the lesson to get storage_key
    const { data: lesson, error: lessonError } = await supabaseClient
      .from('lessons')
      .select('storage_key, course_id')
      .eq('id', lessonId)
      .single()

    if (lessonError || !lesson) {
      console.error('Lesson fetch error:', lessonError)
      return new Response(
        JSON.stringify({ error: 'Lesson not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Verify user has access to this course (either enrolled or is instructor)
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    // Check if user is enrolled in the course
    const { data: enrollment } = await supabaseClient
      .from('course_enrollments')
      .select('id')
      .eq('course_id', lesson.course_id)
      .eq('student_id', user.id)
      .maybeSingle()

    // Check if user is course owner
    const { data: course } = await supabaseClient
      .from('courses')
      .select('instructor_id')
      .eq('id', lesson.course_id)
      .single()

    // Check if user is assigned instructor
    const { data: assignedInstructor } = await supabaseClient
      .from('course_instructors')
      .select('id')
      .eq('course_id', lesson.course_id)
      .eq('instructor_id', user.id)
      .maybeSingle()

    const isOwner = course?.instructor_id === user.id
    const isAssignedInstructor = !!assignedInstructor
    const isEnrolled = !!enrollment
    const isAdmin = profile?.role === 'admin'

    if (!isEnrolled && !isOwner && !isAssignedInstructor && !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create service role client for signed URL generation
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate signed URL with 1 hour expiration
    const { data: signedUrlData, error: signedUrlError } = await supabaseAdmin.storage
      .from('lesson-videos')
      .createSignedUrl(lesson.storage_key, 3600) // 1 hour = 3600 seconds

    if (signedUrlError) {
      console.error('Signed URL error:', signedUrlError)
      return new Response(
        JSON.stringify({ error: 'Failed to generate video URL' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-video-url function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
