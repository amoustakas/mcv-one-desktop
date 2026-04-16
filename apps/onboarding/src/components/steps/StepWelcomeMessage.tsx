'use client';
import type { StepProps } from '../StepRenderer';
import { getVentureBrand } from '@/lib/brand';

// The specialist closes out the journey with a warm, first-person message.
// Content is venture-scoped so Futurestate prospects hear from Hannah Sterling,
// BetEdge prospects hear from Nico, and so on.

function closingMessage(ventureId: string | null | undefined, track: string) {
  const brand = getVentureBrand(ventureId);
  if (track === 'partner') {
    return {
      agent: { handle: '@leo', name: 'Leo Drucker', title: 'Product Strategist', icon: 'L' },
      message: `Welcome in. I'll reach out within a day or two with a partner brief — what we're building, what we're looking for, how we typically work together. If you have a specific deal or integration in mind already, hit reply on that email and we'll fast-track it.`,
    };
  }
  if (track === 'creator') {
    const creator = ventureId === 'warforge'
      ? { handle: '@dieter', name: 'Dieter Wren', title: 'Creative Director', icon: 'D' }
      : { handle: '@nico',   name: 'Nico Vega',   title: 'BetEdge Growth',    icon: 'N' };
    return {
      agent: creator,
      message: `You're in. I'll send over our creator playbook + payout setup within 24 hours. If you already have content you want us to see, drop it in reply — I review every intro personally.`,
    };
  }
  if (ventureId === 'futurestate') {
    return {
      agent: { handle: '@sterling', name: 'Hannah Sterling', title: 'Futurestate IR', icon: 'S' },
      message: `Welcome to Futurestate. I'll be your direct line for everything going forward — round updates, deal flow, quarterly reports, anything that comes up. You'll hear from me within 24 hours with what's active and what's on deck. Happy to have you.`,
    };
  }
  if (ventureId === 'betedge') {
    return {
      agent: { handle: '@nico', name: 'Nico Vega', title: 'BetEdge Growth', icon: 'N' },
      message: `Welcome aboard. BetEdge is a different animal from most sports products — the goal here is sharper edges, not more noise. I'll send your access links and a short walkthrough within a day. See you inside.`,
    };
  }
  return {
    agent: { handle: '@amara', name: 'Amara Reeves', title: 'Investor Relations Chief', icon: 'A' },
    message: `Welcome to ${brand.name}. I'll be in touch within 24 hours with your first update — what's in-flight across the ecosystem, who to talk to for what, and how to get the most out of this relationship. Glad you're here.`,
  };
}

export default function StepWelcomeMessage({ ventureId, track, loading, onAdvance }: StepProps) {
  const brand = getVentureBrand(ventureId);
  const { agent, message } = closingMessage(ventureId, track);

  return (
    <div>
      <h1>Welcome to {brand.name}.</h1>
      <p className="lede">
        You&rsquo;re set up. {agent.name} will take it from here — here&rsquo;s what to expect first.
      </p>

      <div className="wiz-card">
        <div className="wiz-card-agent">
          <div className="wiz-card-agent-avatar" style={{
            background: `linear-gradient(135deg, ${brand.brand}, ${brand.brandAccent})`,
          }}>{agent.icon}</div>
          <div>
            <div className="wiz-card-agent-name">{agent.name}</div>
            <div className="wiz-card-agent-title">{agent.title} · {agent.handle}</div>
          </div>
        </div>
        <p className="wiz-card-agent-line">{message}</p>
        <div className="wiz-cta-row">
          <button
            className="wiz-btn wiz-btn-primary"
            disabled={loading}
            onClick={() => void onAdvance({ outputs: { welcome_sent_at: new Date().toISOString() } })}
          >
            Perfect — I&rsquo;m in.
          </button>
        </div>
      </div>
    </div>
  );
}
