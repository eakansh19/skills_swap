import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get user's skills
    const { data: mySkills } = await supabaseClient
      .from('skills')
      .select('*')
      .eq('user_id', userId);

    if (!mySkills || mySkills.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], message: 'No skills found for user' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all other users with their skills
    const { data: allUsers } = await supabaseClient
      .from('profiles')
      .select('id')
      .neq('id', userId);

    if (!allUsers || allUsers.length === 0) {
      return new Response(
        JSON.stringify({ matches: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch skills for all other users
    const userIds = allUsers.map(u => u.id);
    const { data: allSkills } = await supabaseClient
      .from('skills')
      .select('*')
      .in('user_id', userIds);

    // Simple matching: users who offer what I need
    const myNeeds = mySkills.filter(s => s.skill_type === 'needed').map(s => s.skill_name.toLowerCase());
    const myOffers = mySkills.filter(s => s.skill_type === 'offered').map(s => s.skill_name.toLowerCase());

    const matches = allUsers.map(user => {
      const userSkills = allSkills?.filter(s => s.user_id === user.id) || [];
      const userOffers = userSkills.filter(s => s.skill_type === 'offered').map(s => s.skill_name.toLowerCase());
      const userNeeds = userSkills.filter(s => s.skill_type === 'needed').map(s => s.skill_name.toLowerCase());

      let score = 0;
      
      // They offer what I need
      myNeeds.forEach(need => {
        userOffers.forEach(offer => {
          if (offer.includes(need) || need.includes(offer)) {
            score += 0.5;
          }
        });
      });

      // I offer what they need
      myOffers.forEach(offer => {
        userNeeds.forEach(need => {
          if (offer.includes(need) || need.includes(offer)) {
            score += 0.5;
          }
        });
      });

      return { user_id: user.id, score: Math.min(score, 1) };
    }).filter(m => m.score > 0);

    // If we have matches, use AI to refine them
    if (matches.length > 0 && matches.length <= 10) {
      try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (LOVABLE_API_KEY) {
          const mySkillsText = mySkills.map(s => `${s.skill_type}: ${s.skill_name}`).join(', ');
          
          const aiMatches = await Promise.all(
            matches.slice(0, 5).map(async (match) => {
              const userSkills = allSkills?.filter(s => s.user_id === match.user_id) || [];
              const userSkillsText = userSkills.map(s => `${s.skill_type}: ${s.skill_name}`).join(', ');

              const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${LOVABLE_API_KEY}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash',
                  messages: [
                    {
                      role: 'system',
                      content: 'You are a skill matching AI. Rate the compatibility between two users based on their skills. Return only a number between 0 and 1.'
                    },
                    {
                      role: 'user',
                      content: `User A skills: ${mySkillsText}\nUser B skills: ${userSkillsText}\nHow compatible are they for skill exchange? Return only a number between 0 and 1.`
                    }
                  ]
                }),
              });

              if (response.ok) {
                const data = await response.json();
                const aiScore = parseFloat(data.choices[0]?.message?.content || '0');
                return { ...match, score: (match.score + aiScore) / 2 };
              }
              return match;
            })
          );

          return new Response(
            JSON.stringify({ matches: aiMatches.sort((a, b) => b.score - a.score) }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (aiError) {
        console.error('AI matching error:', aiError);
        // Fallback to basic matching
      }
    }

    return new Response(
      JSON.stringify({ matches: matches.sort((a, b) => b.score - a.score) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in match-skills:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
