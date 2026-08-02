import { SiGithub } from '@icons-pack/react-simple-icons'
import { ArrowUpRight, ImagePlus, Info } from 'lucide-react'
import { Link } from 'react-router'

const issueUrl = 'https://github.com/xinvxueyuan/lty-moe/issues/new?template=submit-work.yml'

export default function Upload() {
  return (
    <section className="archive-container page-shell upload-page">
      <div className="upload-layout">
        <div className="upload-intro">
          <p className="eyebrow">NEW FILE / SUBMISSION</p>
          <h1>
            让你的天依同人
            <br />
            <em>被听见。</em>
          </h1>
          <p>
            把曲绘、插画、PV、3D 或任何与你的歌声有关的作品送进档案。我们会在 GitHub Issue
            中完成投稿和审核。
          </p>
          <Link className="back-home-link" to="/">
            ← 回到首页
          </Link>
        </div>
        <div className="submission-panel">
          <div className="submission-panel-top">
            <span className="upload-icon">
              <ImagePlus size={23} />
            </span>
            <span className="submission-code">FORM / 01</span>
          </div>
          <h2>投稿入口</h2>
          <p>准备好作品图片、简介和原作链接了吗？打开 Issue Form，填写几项信息即可。</p>
          <div className="submission-note">
            <Info size={16} />
            <span>请确认你拥有作品发布权，图片请直接拖入 GitHub 表单。</span>
          </div>
          <a
            className="submission-button inline-flex h-12 w-full items-center justify-center gap-2 bg-[var(--pink)] px-5 text-sm font-medium text-[var(--ink)] hover:bg-[#ff9cc2]"
            href={issueUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <SiGithub size={17} /> 打开 GitHub 投稿表单 <ArrowUpRight size={16} />
          </a>
          <small className="submission-footnote">会在新标签页打开 GitHub Issue Form</small>
        </div>
      </div>
    </section>
  )
}
