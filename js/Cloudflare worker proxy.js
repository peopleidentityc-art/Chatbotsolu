/**
 * =====================================================
 * 보조금24 API 프록시 - Cloudflare Workers
 * 
 * 🔒 보안 설명:
 * - API 키는 Cloudflare Workers의 환경변수(Secrets)에 저장
 * - 프론트엔드에서는 API 키에 접근 불가
 * - CORS 설정으로 허용된 도메인만 접근 가능
 * 
 * 📥 배포 방법:
 * 1. Cloudflare 계정 생성 (무료)
 * 2. Workers & Pages > Create Worker
 * 3. 이 코드 붙여넣기
 * 4. Settings > Variables > Add variable
 *    - 이름: SUBSIDY_API_KEY
 *    - 값: 실제 API 키
 *    - Encrypt 체크
 * 5. Save and Deploy
 * 
 * =====================================================
 */

// 허용된 도메인 (GitHub Pages URL로 변경하세요)
const ALLOWED_ORIGINS = [
    'https://your-username.github.io',
    'https://your-domain.com',
    'http://localhost:3000', // 개발용
];

// CORS 헤더
function corsHeaders(origin) {
    return {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
    };
}

// 메인 핸들러
export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        
        // CORS Preflight
        if (request.method === 'OPTIONS') {
            if (ALLOWED_ORIGINS.includes(origin)) {
                return new Response(null, {
                    headers: corsHeaders(origin)
                });
            }
            return new Response('Forbidden', { status: 403 });
        }

        // POST만 허용
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        // Origin 검증
        if (!ALLOWED_ORIGINS.includes(origin)) {
            return new Response('Forbidden', { status: 403 });
        }

        try {
            // 요청 데이터 파싱
            const answers = await request.json();
            
            // API 파라미터 구성
            const params = buildApiParams(answers);
            
            // API 키 (환경변수에서 가져옴)
            const apiKey = env.SUBSIDY_API_KEY;
            
            if (!apiKey) {
                throw new Error('API key not configured');
            }

            // 보조금24 API 호출
            const apiUrl = new URL('https://api.odcloud.kr/api/gov24/v3/serviceList');
            apiUrl.searchParams.set('serviceKey', apiKey);
            apiUrl.searchParams.set('page', '1');
            apiUrl.searchParams.set('perPage', '20');
            
            Object.entries(params).forEach(([key, value]) => {
                if (value) apiUrl.searchParams.set(key, value);
            });

            const apiResponse = await fetch(apiUrl.toString(), {
                headers: { 'Accept': 'application/json' }
            });

            if (!apiResponse.ok) {
                throw new Error(`API error: ${apiResponse.status}`);
            }

            const data = await apiResponse.json();

            // 결과 정리
            const result = {
                services: (data.data || []).slice(0, 20),
                totalCount: data.totalCount || 0
            };

            return new Response(JSON.stringify(result), {
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(origin)
                }
            });

        } catch (error) {
            console.error('Error:', error);
            
            return new Response(JSON.stringify({
                error: true,
                message: 'Internal server error'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders(origin)
                }
            });
        }
    }
};

// API 파라미터 구성
function buildApiParams(answers) {
    const params = {};
    const type = answers.intro || 'personal';

    switch (type) {
        case 'personal':
            if (answers.region?.sido) {
                params.lifeArray = answers.region.sido;
            }
            if (answers.birthGender?.year) {
                params.age = new Date().getFullYear() - parseInt(answers.birthGender.year);
            }
            if (answers.personalChar && Array.isArray(answers.personalChar)) {
                const chars = answers.personalChar.filter(v => v !== 'JA9999');
                if (chars.length > 0) {
                    params.trgterIndvdlArray = chars.join(',');
                }
            }
            if (answers.familyChar && Array.isArray(answers.familyChar)) {
                const chars = answers.familyChar.filter(v => v !== 'JA9999');
                if (chars.length > 0) {
                    const existing = params.trgterIndvdlArray || '';
                    params.trgterIndvdlArray = existing 
                        ? `${existing},${chars.join(',')}` 
                        : chars.join(',');
                }
            }
            break;

        case 'business':
            if (answers.bizRegion?.sido) {
                params.lifeArray = answers.bizRegion.sido;
            }
            break;

        case 'corp':
            if (answers.corpRegion?.sido) {
                params.lifeArray = answers.corpRegion.sido;
            }
            break;
    }

    return params;
}
