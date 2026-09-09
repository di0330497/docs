// 토픽을 만든 회사·재단 기준 분류. 위에서부터 먼저 맞는 규칙이 이긴다.
export const VENDORS = [
  { id: 'aws',       name: 'Amazon Web Services', sub: 'AWS 클라우드 서비스',
    test: (t) => /^(Amazon|AWS)_/.test(t) || t === 'Elastic_Load_Balancing' },
  { id: 'cncf',      name: 'Cloud Native Computing Foundation', sub: '쿠버네티스 생태계 오픈소스 재단',
    test: (t) => ['Kubernetes', 'Helm', 'Argo_CD'].includes(t) },
  { id: 'cisco',     name: 'Cisco Systems', sub: '네트워크 장비와 공인 자격증',
    test: (t) => /^(350-\d+|CCNA|Cisco)/.test(t) },
  { id: 'docker',    name: 'Docker, Inc.', sub: '컨테이너 플랫폼',
    test: (t) => t === 'Docker' },
  { id: 'hashicorp', name: 'HashiCorp', sub: '인프라 자동화 도구',
    test: (t) => ['Terraform', 'Vault', 'Consul', 'Nomad', 'Packer'].includes(t) },
  { id: 'github',    name: 'GitHub', sub: '코드 호스팅과 자동화',
    test: (t) => /^GitHub/.test(t) },
  { id: 'git',       name: 'Git 프로젝트', sub: '분산 버전 관리 오픈소스',
    test: (t) => t === 'Git' },
  { id: 'microsoft', name: 'Microsoft', sub: '서버 운영체제와 클라우드',
    test: (t) => /^(Windows|Azure|Active_Directory)/.test(t) },
  { id: 'fortinet',  name: 'Fortinet', sub: '네트워크 보안 장비',
    test: (t) => /^Forti/.test(t) },
  { id: 'neutral',   name: '벤더 중립', sub: '특정 회사에 매이지 않는 방법론·관행',
    test: (t) => ['DevOps', 'CICD', 'CI_CD', 'SRE', 'Agile', 'SDLC', 'ITGC', 'ITSM'].includes(t) },
  { id: 'ietf',      name: 'Internet Engineering Task Force', sub: '인터넷 프로토콜 표준(RFC)',
    test: (t) => /^(TCP_IP|TCP|UDP|HTTP|DNS|TLS|IPv[46])/.test(t) },
  { id: 'etc',       name: '기타', sub: '아직 분류되지 않은 토픽', test: () => true },
];

export const vendorOf = (topic) => VENDORS.find((v) => v.test(topic));
