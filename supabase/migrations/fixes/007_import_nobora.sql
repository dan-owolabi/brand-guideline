DO $migration$
DECLARE
    v_user_email TEXT := 'owolabidaniel30@gmail.com';
    v_user_id UUID;
    v_workspace_id UUID;
    v_new_brand_id UUID;
    
    -- ID Mappings
    v_page_0 UUID;
    v_page_1 UUID;
    v_page_2 UUID;
    v_page_3 UUID;
    v_page_4 UUID;
    v_page_5 UUID;
    v_page_6 UUID;
    v_page_7 UUID;
    v_page_8 UUID;
    v_col_0 UUID;
    v_col_1 UUID;
    v_col_2 UUID;
BEGIN
    -- 1. Get User
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User % not found', v_user_email;
    END IF;

    -- 2. Get/Create Workspace
    -- Attempt to find a workspace owned by user
    SELECT id INTO v_workspace_id FROM workspaces WHERE owner_id = v_user_id LIMIT 1;
    
    IF v_workspace_id IS NULL THEN
        -- Create default workspace
        INSERT INTO workspaces (name, slug, owner_id)
        VALUES ('My Workspace', 'my-workspace-' || substr(md5(random()::text), 1, 6), v_user_id)
        RETURNING id INTO v_workspace_id;
    END IF;

    -- 3. Insert Brand
    INSERT INTO brands (
        name, logo_url, banner_url, primary_color, navigation, 
        draft, published, workspace_id
    ) VALUES (
        'Nobora (Imported)',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768073294136-bs2tm.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768481390200-xwpvn2.png',
        '#091f2b',
        '[]',
        '{"tokens":{"logoUrl":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768064345158-ubdv9.png","fontFamily":"Geist","primaryColor":"#091f2b","customFontUrl":null},"sections":[{"id":"cf0422cd-c89a-4ca8-912f-fd1ad1b4ee58","slug":"introduction","group":"Welcome","title":"Welcome","blocks":[{"id":"928a1f8d-81c1-4a98-a5ae-5ef62dd00717","data":{"text":"Who we are","variant":"heading2"},"type":"text","content":{"text":"Introduction","variant":"heading2","tightSpacing":false}},{"id":"3aa3b1df-e880-4230-91bf-d47cb9aa182e","data":{"text":"Nebora is Nigeria''s most intuitive cryptocurrency platform. We''re on a mission to make crypto as simple as mobile banking—because financial empowerment shouldn''t require a computer science degree.","variant":"paragraph"},"type":"text","content":{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\"><ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Your complete resource for building consistent, powerful brand experiences across every touchpoint.</span></li><li>These guidelines ensure that everyone, from our internal teams to external partners, can confidently represent the Nebora brand. Whether you''re designing an app screen, writing a tweet, or creating a presentation, you''ll find everything you need here.</li></ul></p>\n","variant":"paragraph"}},{"id":"ed407ca6-b471-40ff-913d-57b864ae87c1","type":"image","content":{"alt":"Frame 88.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768202772795-z3ymn4.png","width":null,"fullWidth":true}},{"id":"d22a8e68-3eb0-4272-acfb-4ecf9ef2c8e5","type":"text","content":{"text":"Need Help?","variant":"heading3"}},{"id":"f92513db-a121-4eea-90dc-9c27466ae645","type":"text","content":{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Can''t find what you''re looking for? Contact the brand team:</p>\n<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">📧<a class=\"underline underline underline-offset-2 decoration-1 decoration-current/40 hover:decoration-current focus:decoration-current\" href=\"mailto:brand@nebora.com\">brand@nebora.com</a></p>","variant":"paragraph"}}]},{"id":"2f56bb83-e59a-40c9-9830-883eb98128cf","slug":"tone-of-voice","group":"Writing","title":"Tone of voice","blocks":[{"id":"02cffac1-fef1-4cc9-a23f-4af5477799ce","type":"text","content":{"text":"<p data-path-to-node=\"4\"><span style=\"background-color: rgba(0, 0, 0, 0); color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: -0.015em;\">The world of cryptocurrency is often noisy, volatile, and confusing. Nobora is the opposite.&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: -0.2px;\">We are the signal in the noise. We are the stable ground.</span></p>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#eff6ff"}},{"id":"7483cae9-40aa-44da-8785-ef029ab96a64","type":"text","content":{"text":"Our voice is designed to demystify DeFi (Decentralized Finance) for the everyday person. We do not use hype. We do not promise \"to the moon.\" We promise access, ease, and security. We speak with the confidence of a bank but the agility of a tech startup.","variant":"paragraph","tightSpacing":true}},{"id":"252ff695-52b6-42e5-b339-14eddf1d5d96","type":"divider","content":{}},{"id":"2f28c11a-8556-4c46-828d-90b3869eb3b4","type":"text","content":{"text":"How Nebora Speaks","variant":"heading2","tightSpacing":true}},{"id":"ba5bd52b-17cc-4edc-b4d0-1965649cade1","type":"text","content":{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Nebora speaks as a <strong>knowledgeable friend</strong>—confident but never cocky, professional but never cold, expert but never condescending.</p>\n<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Think of us as that friend who really understands crypto and finances, but explains things in a way that makes sense over a beer, not in a boardroom.</p>","variant":"paragraph","tightSpacing":true}},{"id":"ab6d2003-8c44-408c-b053-115f9e4cedb8","type":"text","content":{"text":"1. Bring the Energy.","variant":"heading3"}},{"id":"9d4311aa-9a9d-4794-98da-01db5b7c0550","type":"text","content":{"text":"<p data-path-to-node=\"4\">Money doesn''t have to be boring. We are the spark that gets things moving. Our language is high-voltage and enthusiastic. We don''t just \"process transactions.\" We make things happen. We use punchy sentences and active verbs to keep the momentum going.</p>","variant":"paragraph","tightSpacing":true}},{"id":"68d123a0-763c-475e-af73-4e6dea8539e2","type":"text","content":{"text":"<li><p data-path-to-node=\"7,0,1,0,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"7,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"Your funds have been successfully deposited into your account.\" (Boring)</font></p></li><li><p data-path-to-node=\"7,0,1,1,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"7,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Boom. Your money has landed.\" (Energetic)</font></p></li>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}},{"id":"c8923da8-cc85-4d3c-b6b3-fb7d89b73327","type":"image","content":{"alt":"Frame 92.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768202804260-er76kt.png","fullWidth":false}},{"id":"f6144d94-e553-4995-b608-f3a23690d774","type":"text","content":{"text":"2. Unlock Freedom","variant":"heading3"}},{"id":"78713c50-f4e3-4ad5-bca6-98e79552c552","type":"text","content":{"text":"We are here to break down walls. The old financial system is slow and full of \"no.\" Nobora is full of \"yes.\" We focus on what the user can <i data-path-to-node=\"9\" data-index-in-node=\"139\">do</i> right now. We frame every feature as a superpower that liberates their cash from the digital world into the real world.","variant":"paragraph"}},{"id":"30e31250-de84-4159-9db2-66a6b61269e8","type":"text","content":{"text":"<ul><li><span data-path-to-node=\"10,0,1,0,0\" data-index-in-node=\"0\" style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\">Instead of:</span><span style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\"> \"You can withdraw your crypto to a local bank account.\" (Functional)</span></li><li><span data-path-to-node=\"10,0,1,1,0\" data-index-in-node=\"0\" style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\">Nobora says:</span><span style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\"> \"Crypto to Cash. Spend it anywhere, anytime. You''re free.\" (Liberating)</span></li></ul>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}},{"id":"280649c6-6467-472e-9747-ab330d7f25b6","type":"image","content":{"images":[]}},{"id":"8ce7b197-658e-4e9d-949d-4c6c432a8d2a","type":"text","content":{"text":"3. Keep It Real","variant":"heading3"}},{"id":"ac125184-c3d6-40ea-a380-fadcb65157a2","type":"text","content":{"text":"We don''t talk like a suit. We talk like friends. We are part of the internet culture. We use casual language, relevant slang (when it fits), and a conversational rhythm. We are not trying to impress you with big words. We are trying to vibe with you.","variant":"paragraph"}},{"id":"35376b71-4007-4ede-b321-47f0a698351f","type":"text","content":{"text":"<li><p data-path-to-node=\"13,0,1,0,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"13,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"We offer competitive interest rates on your stablecoin savings.\" (Corporate)</font></p></li><li><p data-path-to-node=\"13,0,1,1,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"13,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Let your money chill and earn. While you sleep, your balance grows.\" (Youthful)</font></p></li>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}},{"id":"52504541-70fd-474c-bcca-14bc2186e2d9","type":"image","content":{}},{"id":"00dfed47-661b-4133-ae46-e1b7c2469270","type":"text","content":{"text":"4. Be Bold and Direct","variant":"heading3"}},{"id":"44227ce9-e519-41a7-a3d4-666d7819364a","type":"text","content":{"text":"Confidence is attractive. We don''t hedge our bets or use timid language. We tell you exactly what to do and what you will get. We use short, imperative headlines that act as a call to adventure rather than just a call to action.","variant":"paragraph"}},{"id":"18f18876-21e8-4e17-b7fe-fe7dd9dfa06b","type":"text","content":{"text":"<li><p data-path-to-node=\"16,0,1,0,0\"><font face=\"monospace\"><b style=\"\"><i style=\"\"><span data-path-to-node=\"16,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"Please sign up to start trading.\" (Polite)</i></b></font></p></li><li><p data-path-to-node=\"16,0,1,1,0\"><font face=\"monospace\"><b style=\"\"><i style=\"\"><span data-path-to-node=\"16,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Get in. Start winning.\" (Bold)</i></b></font></p></li>","variant":"paragraph"}},{"id":"0e67587e-e243-4f86-be36-364d5f0a3ded","type":"image","content":{}},{"id":"90ccb3a7-607d-4780-8b29-26213f9d40e2","type":"text","content":{"text":"5. Celebrate the Wins","variant":"heading3"}},{"id":"82629094-6a67-41e9-9c7f-ac51560795c8","type":"text","content":{"text":"Every saved dollar and every successful swap is a win. We act as the user''s personal hype team. We use positive, affirming language to make financial management feel like a game that they are winning.<div><br><div><li><p data-path-to-node=\"19,0,1,0,0\"><b><i><font face=\"monospace\"><span data-path-to-node=\"19,0,1,0,0\" data-index-in-node=\"0\">Instead of:</span> \"Transaction history updated.\" (System status)</font></i></b></p></li><li><p data-path-to-node=\"19,0,1,1,0\"><b><i><font face=\"monospace\"><span data-path-to-node=\"19,0,1,1,0\" data-index-in-node=\"0\">Nobora says:</span> \"Another smart move. Check out your latest wins.\" (Celebratory)</font></i></b></p></li></div></div>","variant":"paragraph"}},{"id":"2930500c-ba5c-4398-9a46-63dc34738a6a","type":"image","content":{}},{"id":"50cb22f9-b566-4f28-bd65-44f06e99a185","type":"divider","content":{}},{"id":"36aaa73a-173d-4c70-b5da-3a2462e7801e","type":"text","content":{"text":"When to adjust your tone","variant":"heading2","tightSpacing":true}},{"id":"9f85fd41-21cf-4c70-95e3-aa34d7fe82df","type":"text","content":{"text":"While Nobora is always high-energy, we know when to turn the volume up and when to focus on clarity.","variant":"paragraph","tightSpacing":true}},{"id":"99e71a71-dc95-4650-b9ac-77e4ab88c5e6","type":"text","content":{"text":"By Context","variant":"heading3","tightSpacing":false}},{"id":"fc9f9b20-2ee5-45ad-b857-615c8980cea3","type":"text","content":{"text":"<b data-path-to-node=\"21,0,0\" data-index-in-node=\"0\">Social Media (Volume: 10/10):</b> This is our playground. We are the \"Main Character.\" We use memes, trend-jacking, and maximum hype. We celebrate user wins loudly. If the market is crashing, we are the friends cracking a joke to keep spirits high.","variant":"paragraph"}},{"id":"9321b937-47b5-4888-9870-73dd5797aacd","type":"text","content":{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,0,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span> Unfiltered, witty, and loud.</u></i></font>","variant":"paragraph","tightSpacing":true}},{"id":"4f484e39-7d89-41a7-b096-e3eb14fce43c","type":"text","content":{"text":"<b data-path-to-node=\"21,1,0\" data-index-in-node=\"0\">Product &amp; In-App (Volume: 7/10):</b> We keep the energy high, but functionality comes first. We want the user to feel fast and efficient. We use micro-copy that rewards action (\"Nice,\" \"Got it,\" \"Done\").","variant":"paragraph"}},{"id":"02520ef4-7505-44c5-bec7-a6e9e9442ac0","type":"text","content":{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,1,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span> Punchy, encouraging, and frictionless.</u></i></font>","variant":"paragraph","tightSpacing":true}},{"id":"5e1e4709-cf10-41b7-b1d5-97856e2deade","type":"text","content":{"text":"<b data-path-to-node=\"21,2,0\" data-index-in-node=\"0\">Customer Support (Volume: 4/10):</b> When things go wrong, the \"hype\" needs to take a backseat to \"help.\" We drop the slang if it confuses the issue. We are still not corporate robots, though. We are the \"smart friend who knows how to fix it.\" We are calm, capable, and on their side.","variant":"paragraph"}},{"id":"6aa9cb68-fba4-41b3-a14e-3efbb8e2985c","type":"text","content":{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,1,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span>&nbsp;Real, empathetic, and solution-focused.</u></i></font>","variant":"paragraph","tightSpacing":true}},{"id":"7b39a6be-ddea-4137-9835-4cfd9375cefe","type":"text","content":{"text":"By Audience","variant":"heading3"}},{"id":"94fb310a-24d8-45b0-aba8-79da5df2ac45","type":"text","content":{"text":"Audience: The Newbie (Just joined)","variant":"heading3","tightSpacing":true}},{"id":"d8da3766-db4d-4054-8cc5-7e5338a34dbc","type":"text","content":{"text":"<b data-path-to-node=\"9,0,0\" data-index-in-node=\"0\">Mindset:</b> Excited but maybe a little intimidated by crypto.","variant":"paragraph"}},{"id":"0d1691c6-5e66-48bc-af35-9587b8ef9066","type":"text","content":{"text":"<b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Our Tone:</b> The Welcoming Committee. We make them feel like they just joined the coolest club on earth. We emphasize ease and safety.","variant":"paragraph","tightSpacing":true}},{"id":"c6f91cdd-d489-4b1d-9d0a-26af7e876e91","type":"text","content":{"text":"<i><b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Voice:</b>&nbsp;\"You are in. Let''s show you around.\"</i>","variant":"paragraph","tightSpacing":true}},{"id":"0127f692-1430-41fd-b8bf-3fbcdc8c005c","type":"text","content":{"text":"By Audience","variant":"heading3"}},{"id":"1be9953e-a844-4645-b2fa-e83eece76a78","type":"text","content":{"text":"Audience:  The Grinder (Active Trader/Saver)","variant":"heading3","tightSpacing":true}},{"id":"171dd1f2-60a4-4e33-bd2d-967f60adc04f","type":"text","content":{"text":"<b data-path-to-node=\"9,0,0\" data-index-in-node=\"0\">Mindset:</b> Knows the game. Wants speed and results.","variant":"paragraph"}},{"id":"f87668b4-2cde-4240-a3a0-635d6a48eb17","type":"text","content":{"text":"<b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Our Tone:</b> The Hype Man. We validate their moves. We acknowledge their hustle.","variant":"paragraph","tightSpacing":true}},{"id":"1ea3ad39-19bb-474a-86fa-f417e6b257be","type":"text","content":{"text":"<i><b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Voice:</b>&nbsp;\"Market is moving. Good thing you are too.\"</i>","variant":"paragraph","tightSpacing":true}},{"id":"83e487ae-cbd0-423e-ab0a-7c6e256db70c","type":"divider","content":{}},{"id":"63ec208d-9660-4f09-b73c-3ae5f06829b7","type":"text","content":{"text":"Ready-to-use Examples","variant":"heading2"}},{"id":"d22a4334-c684-48b2-ab92-8b6f23a8ce59","type":"text","content":{"text":"Here is how the <b data-path-to-node=\"17\" data-index-in-node=\"16\">Nobora</b> voice translates into actual copy compared to a traditional bank.","variant":"paragraph"}},{"id":"8c485347-5256-4f98-92a0-5d0bb929031e","type":"text","content":{"text":"Headlines","variant":"heading3"}},{"id":"8c7a3167-d363-484b-ad0a-0ff4ca8d8b9d","type":"text","content":{"text":"<li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Your Wallet. On Steroids.</span></li><li><p data-path-to-node=\"2,1,0\">Break Up With Your Bank.</p></li><li><p data-path-to-node=\"2,2,0\">Crypto made for humans. (Finally.)</p></li><li><p data-path-to-node=\"2,3,0\">Stop watching. Start earning.</p></li><li><p data-path-to-node=\"2,4,0\">Your money, moving at the speed of the internet.</p></li><li><p data-path-to-node=\"2,5,0\">The only wallet you actually want to use.</p></li>","variant":"paragraph"}},{"id":"c4fb704c-0a2a-42d4-9651-bd12f780d313","type":"text","content":{"text":"General CTAs (Calls to Action)","variant":"heading3"}},{"id":"cb30ff16-5aeb-4a1a-bf49-27fc406592aa","type":"text","content":{"text":"<li><p data-path-to-node=\"4,0,0\"><span data-path-to-node=\"4,0,0\" data-index-in-node=\"0\">Send It</span></p></li><li><p data-path-to-node=\"4,1,0\"><span data-path-to-node=\"4,1,0\" data-index-in-node=\"0\">Let''s Go</span></p></li><li><p data-path-to-node=\"4,2,0\"><span data-path-to-node=\"4,2,0\" data-index-in-node=\"0\">Get the Alpha</span></p></li><li><p data-path-to-node=\"4,3,0\"><span data-path-to-node=\"4,3,0\" data-index-in-node=\"0\">Secure the Bag</span></p></li><li><p data-path-to-node=\"4,4,0\"><span data-path-to-node=\"4,4,0\" data-index-in-node=\"0\">Start Winning</span></p></li><li><p data-path-to-node=\"4,5,0\"><span data-path-to-node=\"4,5,0\" data-index-in-node=\"0\">Unlock Freedom</span></p></li><li><p data-path-to-node=\"4,6,0\"><span data-path-to-node=\"4,6,0\" data-index-in-node=\"0\">Claim Your Account</span></p></li>","variant":"paragraph"}},{"id":"6f4e112f-265f-4abd-92d4-f2db572356df","type":"text","content":{"text":"Onboarding &amp; Empty States","variant":"heading3"}},{"id":"5f3928f8-4a33-42e4-b010-d6f4810470ae","type":"text","content":{"text":"<li><span data-path-to-node=\"6,0,0\" data-index-in-node=\"0\" style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><b>No Transactions</b></span><b data-path-to-node=\"6,0,0\" data-index-in-node=\"0\" style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">:</b><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"> It''s quiet in here. Too quiet. Make a move.</span></li><li><p data-path-to-node=\"6,1,0\"><b data-path-to-node=\"6,1,0\" data-index-in-node=\"0\">Identity Verification:</b> Let''s make sure you are you. Quick selfie?</p></li><li><p data-path-to-node=\"6,2,0\"><b data-path-to-node=\"6,2,0\" data-index-in-node=\"0\">Account Setup:</b> First things first. Let''s get you set up.</p></li><li><p data-path-to-node=\"6,3,0\"><b data-path-to-node=\"6,3,0\" data-index-in-node=\"0\">Zero Balance:</b> You''re sitting on zero. Let''s fix that.</p></li><li><p data-path-to-node=\"6,4,0\"><b data-path-to-node=\"6,4,0\" data-index-in-node=\"0\">Connect Bank:</b> Link up. Cash in.</p></li>","variant":"paragraph","tightSpacing":true}},{"id":"aa7e7468-101b-4525-88db-e01a0c402786","type":"text","content":{"text":"Feature Descriptions","variant":"heading3"}},{"id":"b65f15c4-c561-4f53-a628-b7747fb914bf","type":"text","content":{"text":"1. The Swap Feature","variant":"heading4","tightSpacing":true}},{"id":"fd85d0d7-77d4-497d-9830-e09c13c8a0c3","type":"text","content":{"text":"<li><p data-path-to-node=\"8,0,0\"><b data-path-to-node=\"8,0,0\" data-index-in-node=\"0\">The Swap:</b> Swap it like it''s hot. Instant trades. Zero stress.</p></li><li><p data-path-to-node=\"8,1,0\"><b data-path-to-node=\"8,1,0\" data-index-in-node=\"0\">Savings:</b> Lazy money is lost money. Put your cash to work while you sleep.</p></li><li><p data-path-to-node=\"8,2,0\"><b data-path-to-node=\"8,2,0\" data-index-in-node=\"0\">Security:</b> Locked down tight. Your keys, your crypto, your peace of mind.</p></li><li><p data-path-to-node=\"8,3,0\"><b data-path-to-node=\"8,3,0\" data-index-in-node=\"0\">Withdrawals:</b> Crypto to Cash. In seconds. Spend it on real life.</p></li><li><p data-path-to-node=\"8,4,0\"><b data-path-to-node=\"8,4,0\" data-index-in-node=\"0\">Market Trends:</b> Don''t guess. We''ve got the cheat codes right here.</p></li>","variant":"paragraph"}},{"id":"957dc720-ed36-4b47-b767-32e1b0c4d242","type":"text","content":{"text":"Social Media Captions","variant":"heading3","tightSpacing":false}},{"id":"5b86b44d-dd58-4dbb-99a5-bf9fb5a5d50b","type":"text","content":{"text":"<li><p data-path-to-node=\"10,0,0\"><b data-path-to-node=\"10,0,0\" data-index-in-node=\"0\">Market Dip:</b> Red charts? Discount shopping day. 🛒</p></li><li><p data-path-to-node=\"10,1,0\"><b data-path-to-node=\"10,1,0\" data-index-in-node=\"0\">New Feature:</b> You asked. We listened. Then we built it. Drop 2.0 is live. 🔥</p></li><li><p data-path-to-node=\"10,2,0\"><b data-path-to-node=\"10,2,0\" data-index-in-node=\"0\">Community Love:</b> Shoutout to everyone holding through the weekend. We see you. 👀</p></li><li><p data-path-to-node=\"10,3,0\"><b data-path-to-node=\"10,3,0\" data-index-in-node=\"0\">Motivation:</b> If you were waiting for a sign to start, this is it. 🚀</p></li><li><p data-path-to-node=\"10,4,0\"><b data-path-to-node=\"10,4,0\" data-index-in-node=\"0\">Lifestyle:</b> Coffee paid for by crypto yields. The best kind of morning. ☕️</p></li><li><p data-path-to-node=\"10,5,0\"><b data-path-to-node=\"10,5,0\" data-index-in-node=\"0\">Speed:</b> Faster than your bank. Smoother than your ex. Try Nobora.</p></li>","variant":"paragraph"}}]},{"id":"243d2756-ae1b-4025-9be5-8c0c247fc83c","slug":"logos","group":"Design","title":"Logos","blocks":[{"id":"3b3bf8c1-1530-4318-b6ec-054e45bbd100","type":"text","content":{"text":"The badge of the New Era","variant":"heading2"}},{"id":"a131153b-a83c-4fc0-a3c5-31617ceb4f80","type":"text","content":{"text":"<p data-start=\"192\" data-end=\"219\">This is the face of Nobora.</p>\n<p data-start=\"221\" data-end=\"465\">It represents movement, progress, and money that doesn’t stay stuck.&nbsp;</p>","variant":"heading3","tightSpacing":true}},{"id":"4e4fad33-39fc-4cfb-b3f0-36f939374a14","type":"text","content":{"text":"The logo is designed to feel modern, fast, and optimistic. It should always feel clear, confident, and easy to recognize, whether it’s on an app icon or a full website header.<br>","variant":"paragraph"}},{"id":"cec57889-5426-4d9a-86dd-4e2cedc3432f","type":"image","content":{"alt":"Frame 94.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768205604627-gk94cj.png","width":null,"caption":"Nobora Logo","fullWidth":false}},{"id":"5543d087-b441-4684-9ad3-a8eed10d8760","type":"text","content":{"text":"Logotype","variant":"heading2"}},{"id":"18891b78-4474-4b21-8304-974bbe7a94ac","type":"text","content":{"text":"<p data-start=\"636\" data-end=\"674\">The word <b>“nobora”</b> is set in lowercase.</p>\n<p data-start=\"676\" data-end=\"900\">Lowercase keeps the brand approachable and modern. It feels open, friendly, and digital-first, not rigid or institutional. The type is clean and simple, so it stays readable at any size, from a phone screen to a large banner.</p><p data-start=\"676\" data-end=\"900\"><br></p><p data-start=\"676\" data-end=\"900\">The <b>Logotype and Icon</b> are designed to be used as a unit. We have optically adjusted the lettering for a specific rhythm, so please use the official logo files instead of typing the name manually. However, in body copy or live web text, type the name using the font.</p>","variant":"paragraph"}},{"id":"f62a1648-40d2-423b-a31b-dc61fb879e64","type":"text","content":{"text":"Use the wordmark when:","variant":"heading3","tightSpacing":true}},{"id":"df046795-45d2-43ff-8cfb-23906b5ff467","type":"text","content":{"text":"<p data-start=\"902\" data-end=\"924\"><span style=\"background-color: transparent; font-family: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit;\"><i>Introducing the brand</i></span></p><ul data-start=\"925\" data-end=\"1027\"><li data-start=\"949\" data-end=\"982\"><p data-start=\"951\" data-end=\"982\"><i>Clarity matters more than speed</i></p></li><li data-start=\"983\" data-end=\"1027\"><p data-start=\"985\" data-end=\"1027\"><i>There’s enough space to show the full name</i></p></li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"a85a4eb5-d6ad-43b9-b77a-8f61c5bfc0f4","type":"image","content":{"alt":"Frame 100.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768212431196-sfp8yn.png"}},{"id":"84cd6513-ef29-418b-a738-7b402310c68b","type":"text","content":{"text":"Logomark (Icon)","variant":"heading2"}},{"id":"174f266a-b042-4b3e-8264-fed21eb00761","type":"text","content":{"text":"<p data-start=\"1054\" data-end=\"1157\">The icon is built from the letter <strong data-start=\"1088\" data-end=\"1093\">N</strong>, combined with a directional takeoff shape that forms an arrow.&nbsp;<span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">It communicates&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">forward movement,&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">growth, and t</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">ransition from local to global money.</span></p><p data-start=\"1159\" data-end=\"1175\"><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></p>\n<p data-start=\"1251\" data-end=\"1405\">The arrow cutting through the form gives the logo energy. It feels like motion, not a static badge. This makes the icon strong enough to stand on its own.&nbsp;</p>","variant":"paragraph"}},{"id":"67350716-5c4e-43a8-9883-7b520282ea1b","type":"text","content":{"text":"Use the icon when","variant":"heading3","tightSpacing":true}},{"id":"ec8b34f4-eb2c-4db7-8de2-3d5ba2cf4f5a","type":"text","content":{"text":"<li data-start=\"1426\" data-end=\"1444\"><p data-start=\"1428\" data-end=\"1444\"><i>Space is limited</i></p>\n</li>\n<li data-start=\"1445\" data-end=\"1476\">\n<p data-start=\"1447\" data-end=\"1476\"><i>The brand is already familiar</i></p>\n</li>\n<li data-start=\"1477\" data-end=\"1507\">\n<p data-start=\"1479\" data-end=\"1507\"><i>Speed and recognition matter</i></p></li>","variant":"paragraph"}},{"id":"21a5dc40-e465-47d3-806a-0d99030ac6ba","type":"imageGrid","content":{"images":[{"alt":"Frame 93.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206144464-k8d8wk.png"},{"alt":"Frame 95.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206144464-ylf7fr.png"}],"aspectRatio":"square"}},{"id":"ae8073d9-b053-4d9f-a41a-0cc83cf66f79","type":"text","content":{"text":"Logo Usage Guidelines","variant":"heading2"}},{"id":"fc666015-3aa3-4bf7-981a-e9f0fe3b3cf3","type":"text","content":{"text":"Use the Nobora logo clearly and consistently. When in doubt, keep it simple and&nbsp;<div>high-contrast.</div>","variant":"paragraph","tightSpacing":true}},{"id":"ffa62b44-bc70-492a-8226-edd7630d87ab","type":"imageGrid","content":{"images":[{"alt":"Frame 96.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511854-8r7x6d.png","caption":"Dark Background"},{"alt":"Frame 97.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511855-3qd8e.png","caption":"Blue Background"},{"alt":"Frame 99.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511855-w5xiha.png","caption":"Orange Background"}],"aspectRatio":"auto","tightSpacing":true}},{"id":"9ad4dd89-3da5-4999-9f3b-054e77620bc1","type":"text","content":{"text":"Primary Logo Usage&nbsp;","variant":"heading3"}},{"id":"6d02b4e7-0598-46d5-a308-4f0567969ce6","type":"text","content":{"text":"<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">The </span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>Nobora blue</b></span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"> logos are the default and primary expression of the Nobora brand.</span></div><br><b>They represent:</b><br><ul><li>Trust</li><li>Stability</li><li>Credibility</li><li>“Signal in the noise”</li></ul><div><b><br></b></div><div><b>Rule:</b></div><div>When in doubt, use the <b>Nobora blue</b> logo.<br>Product UI,s website headers, formal communications, partnerships, and anything trust-critical must use the blue logo.<br></div>","variant":"paragraph"}},{"id":"f594a4f5-315b-4af9-8f5f-80604ad2d260","type":"text","content":{"text":"Secondary Logo Usage&nbsp;","variant":"heading3"}},{"id":"a124eea5-b244-4581-ac18-0381ced65a1e","type":"text","content":{"text":"<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"></span></div>The orange logo is <b>allowed</b>, but it is not a <b>replacement</b> for the primary logo.<br><br>Orange is expressive, energetic, and attention-grabbing. That makes it powerful but dangerous if overused.<br><br><b>When orange is appropriate</b><br><ul><li>Orange logo can be used in:</li><li>Campaigns and launches</li><li>Social media posts</li><li>Marketing moments</li><li>Celebratory states</li><li>Short-lived visuals</li><li>High-energy brand expressions</li></ul><br><b>Think movement, momentum, </b>and<b> wins, </b>not<b> infrastructure.</b><div><br></div>","variant":"paragraph"}},{"id":"10d48209-f557-4770-9034-8b2a06792f88","type":"text","content":{"text":"Minimum Size","variant":"heading2"}},{"id":"bcbe6268-99d6-4eb1-aff0-be2569d9110b","type":"text","content":{"text":"To ensure legibility across all digital devices, the full logo lockup must maintain a minimum width of&nbsp;<strong>126 pixels</strong>. Scaling below this size compromises readability and is not permitted.","variant":"paragraph"}},{"id":"4f4430ac-f4da-4877-b6a7-5455f368ce73","type":"image","content":{"alt":"Frame 102.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768218614275-plq9f5.png","caption":"Minimum size lockup"}},{"id":"e45be41c-c811-42a6-97e2-f83105ad9dfb","type":"text","content":{"text":"Logo Positioning","variant":"heading2"}},{"id":"8b6db0c3-314d-4b9a-8ab5-8dc3ff455680","type":"text","content":{"text":"<b data-path-to-node=\"6,0\" data-index-in-node=\"0\">The Default:</b> Place the logo in the <b data-path-to-node=\"6,0\" data-index-in-node=\"35\">Top Left</b>.\n<b data-path-to-node=\"6,0\" data-index-in-node=\"45\">The Backup:</b> If the design requires a different layout, refer to the visual guide below for approved positions.","variant":"paragraph"}},{"id":"703ff7ec-510e-472c-b09c-435e92c4cff0","type":"image","content":{"alt":"Frame 101.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768219607497-tny2a9.png","caption":"Logo positioning "}},{"id":"909b5f2f-9a18-4aaa-9039-6ba3838f0129","type":"text","content":{"text":"Clear Space","variant":"heading2"}},{"id":"c5f62bf5-fb39-48b8-acd2-048ad18e42fb","type":"text","content":{"text":"<p data-start=\"127\" data-end=\"220\">Always leave enough clear space around the Nobora logo so it remains legible and uncluttered.</p>\n<p data-start=\"222\" data-end=\"359\">The minimum clear space is defined by the height of the <strong data-start=\"278\" data-end=\"285\">“n”</strong> in the wordmark. This space should be kept free on all sides of the logo.</p>\n<p data-start=\"361\" data-end=\"423\">No text, images, UI elements, or edges should enter this area.</p>\n<p data-start=\"425\" data-end=\"521\">Clear space protects the logo’s visibility and ensures it always feels intentional, not crowded.</p>","variant":"paragraph"}},{"id":"b8cd1870-eaf4-4fb3-9571-d766db07da84","type":"image","content":{"alt":"Frame 103.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768220814705-ykpsf7.png","caption":"Clear space"}},{"id":"f2cdc7a2-0ad3-4f20-94fa-ace7996185d1","type":"text","content":{"text":"Logo Don''ts","variant":"heading2"}},{"id":"3d2e6798-140a-4fb4-b7be-e1061e4eb6fa","type":"text","content":{"text":"To maintain brand integrity, strictly use the provided master artwork files. Ensure the logo stands out clearly against its background and never alter, stretch, or distort the file.","variant":"paragraph"}},{"id":"0c2b4b4b-a7a3-4fd0-bdd0-337ad40d943a","type":"imageGrid","content":{"images":[{"alt":"Frame 104.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978735-vahmb.png","caption":"","description":"Don''t warp or distort our logo in any way "},{"alt":"Frame 105.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-p2zu2.png","description":"Don''t rotate any of our logo"},{"alt":"Frame 106.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-h64sec.png","caption":"","description":"Don''t use other typefaces as a replacement for our logo"},{"alt":"Frame 107.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-syy83y.png","description":"Don''t change the logo colors"},{"alt":"Frame 108.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-j0nl59.png","description":"Don''t add gradients to our logo"},{"alt":"Frame 109.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-fv3r2.png","description":"Don''t crop the logo"},{"alt":"Frame 110.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-o99r4c.png","description":"Don''t add any effects to the logo"},{"alt":"Frame 111.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-ufyns.png","description":"Don''t add any visual elements to our logo"}],"aspectRatio":"landscape"}},{"id":"86777834-e555-493c-a6f3-1c3211a01830","type":"text","content":{"text":"App Icon","variant":"heading2"}},{"id":"cc423a48-773d-4f86-b1c2-74418eeaeb64","type":"text","content":{"text":"Just the Mark. The Blue Arrow centered on Deep Navy. It stands out on any home screen. Tap it to unlock freedom.","variant":"paragraph"}},{"id":"9fb9686a-d134-4469-9813-11335bbf485e","type":"imageGrid","content":{"alt":"Frame 102j.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768228690281-hlwb9c.png","images":[{"alt":"Frame 113.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768229054509-6b9ze5.png"},{"alt":"Frame 1029.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768229202483-ixvj1.png"}],"aspectRatio":"square"}}],"subsections":[{"id":"e394c2de-725b-4430-bf7b-9e8a7787725b","title":"Our logo","blocks":[{"id":"604ff11d-b234-4c26-b965-1fc089230713","type":"text","content":{"text":"Primary Logo","variant":"heading2"}},{"id":"cb2b0d3a-afad-4244-8653-4450142a5500","type":"text","content":{"text":"Use this logo in most applications.","variant":"paragraph"}}]},{"id":"fb551efc-a235-4ad1-9df1-0f99127d733c","title":"Logo positioning","blocks":[{"id":"5951615a-7b3a-4464-8a6f-e9e283ba0663","type":"text","content":{"text":"Clearspace","variant":"heading2"}},{"id":"88534dcd-ba8d-47a9-b72d-edbdc066f112","type":"text","content":{"text":"Always maintain clear space around the logo.","variant":"paragraph"}}]}]},{"id":"9d6c68cf-0619-4023-a356-1394879da831","slug":"colors","group":"Design","title":"Colors","blocks":[{"id":"f225d520-e4d3-4ec8-820f-78a3894c8f62","type":"text","content":{"text":"Color is a core part of the Nobora identity. It sets the mood, builds recognition, and helps the brand feel confident and modern across every touchpoint.","variant":"heading3","tightSpacing":true}},{"id":"ee3761ba-5927-441d-a8f4-4b491512f3a8","type":"text","content":{"text":"The primary colors define the brand’s foundation and should be used most often. Secondary and accent colors support the system by adding flexibility, hierarchy, and emphasis where needed.&nbsp;<div><br></div><div>&nbsp;Used consistently, the color palette ensures Nobora feels clear, energetic, and recognizable across product, marketing, and social media.</div>","variant":"paragraph"}},{"id":"609e9ad8-9948-4bce-8347-4962c18d1bca","type":"text","content":{"text":"Primary Colors","variant":"heading2"}},{"id":"6190b1fc-950c-4d9e-bea0-bc59b65ee109","type":"text","content":{"text":"The primary colors form the foundation of the Nobora brand. They appear most often across product, marketing, and digital experiences.&nbsp;<div><br></div><div><b>Midnight Navy&nbsp;</b></div><div>This is the anchor color of the brand. It brings depth, stability, and trust. Use it for core surfaces, dark backgrounds, headers, and product environments where clarity and focus are needed.&nbsp;</div><div><br></div><div><b>Royal Blue</b></div><div>This is the main brand expression color. It feels modern, confident, and energetic. Use it for key sections, highlights, interactive elements, and brand-forward moments.</div><div><br></div><div>Primary colors should dominate most layouts and always feel intentional and balanced.</div>","variant":"paragraph"}},{"id":"c59a993c-d613-4ceb-971c-1b4239da765e","type":"image","content":{"alt":"MacBook Pro 14_ - 7.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768309427199-u7ea4.png","width":null,"fullWidth":true}},{"id":"cca32c45-dfd4-4167-82ea-9aeb9fbbea3a","type":"text","content":{"text":"Secondary Colors","variant":"heading2"}},{"id":"29f2e83a-654c-45b2-aa5c-110b945c2d4a","type":"text","content":{"text":"Secondary colors support the primary palette by adding contrast, emphasis, and flexibility.","variant":"paragraph","tightSpacing":true}},{"id":"4f35796f-daae-4f4e-a1a5-174dbe999baf","type":"text","content":{"text":"<b>Signal Orange</b><div>This is the accent color. It introduces energy and urgency and should be used sparingly. Use it for calls to action, notifications, highlights, and moments that need attention.&nbsp;</div><div><br></div><div><b>Soft Ivory</b></div><div>This is a neutral support color. It provides breathing space and balance, helping layouts feel clean and readable. Use it for backgrounds, content areas, and to soften bold compositions.&nbsp;</div><div><br></div><div>Secondary colors should never overpower the primary colors. They exist to support, not lead.</div>","variant":"paragraph"}},{"id":"f1037ce8-5377-4edf-a933-c2c991c58660","type":"text","content":{"text":"Accent Colors","variant":"heading2"}},{"id":"2ff2fa88-55f0-4cf7-80cf-4e7190e5a2ee","type":"text","content":{"text":"Accent colors are used to add energy, personality, and emphasis across the Nobora brand. They bring moments to life without overpowering the core palette.\n\nAccent colors should be used sparingly and intentionally.&nbsp;<div><br></div><div>They are not meant to replace the primary colors, but to support them by drawing attention to key actions, highlights, or expressive moments.&nbsp;</div><div><br></div><div><b>Use accent colors for</b></div><div>1. Callouts and highlights</div><div>2. Illustrations and graphic elements</div><div>3. Badges, states, and promotional moments</div><div>4. Social media and campaign visuals</div>","variant":"paragraph","tightSpacing":true}},{"id":"2ddb41a7-a2da-4f20-842b-ff7ae065cf64","type":"image","content":{"alt":"Frame 1037.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768309449656-v97spj.png","width":null,"fullWidth":true}},{"id":"f8614d69-8c91-44da-87ce-958acbcc223f","type":"text","content":{"text":"Accent Color Groups","variant":"heading3"}},{"id":"adc9b1d6-df0e-4519-b71f-b4bca8aa0817","type":"text","content":{"text":"Accent colors are grouped by hue to keep the system simple and flexible. Each group includes a stronger tone and a softer supporting tone.&nbsp;<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b><br></b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>1. Accent Greens</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for growth, success states, highlights, and energetic moments.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>2. Accent Pinks</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for expressive, playful, or human-focused moments.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>3. Accent Yellows</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for attention, optimism, and emphasis.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>4. Accent Teals</b></span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">&nbsp;</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for calm, balance, and supportive accents.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>5. Accent Neutrals</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for warmth, softness, and subtle contrast. These support layouts without drawing attention.</span></div>","variant":"paragraph"}},{"id":"d6bc2bb8-5eb7-4f4c-9764-c612970c3f2f","type":"text","content":{"text":"Avoid using multiple accent colors in a single layout unless there is a clear reason. Too many accents reduce clarity and weaken impact.&nbsp;<div><br></div><div><i style=\"\">When in doubt, lead with the primary colors and let accent colors do the talking in small, focused moments.</i></div>","variant":"heading3"}},{"id":"34d61be3-7be5-4da9-bcd3-658921130cdb","type":"divider","content":{}},{"id":"0442de06-9da8-4f2f-9dd9-4e82ff399045","type":"text","content":{"text":"Tints","variant":"heading2"}},{"id":"f2c98d75-8091-4196-be21-e532bf8ddf67","type":"text","content":{"text":"Tints are lighter versions of a base color, created by mixing the color with white.\n\nThey are primarily used for backgrounds, surfaces, and soft UI states. Tints help create breathing space, improve readability, and keep layouts feeling light and open.\n\nUse tints to support content, not to draw attention.","variant":"paragraph"}},{"id":"49725746-c5f9-42d0-8e7f-a11d22442fcc","type":"image","content":{"alt":"Frame 1049.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768310709978-71eydc.png","width":null,"fullWidth":true}},{"id":"cb2cadc1-6290-4a92-b26b-e27a7b515c1f","type":"text","content":{"text":"Shades","variant":"heading2"}},{"id":"cf27ad92-1e47-4144-8c97-892858f32ce6","type":"text","content":{"text":"Shades are darker versions of a base color, created by mixing the color with black.\n\nThey are used for emphasis, depth, and contrast. Shades work well for dark backgrounds, overlays, and strong interactive or focus states.\n\nUse shades to establish hierarchy and guide attention.","variant":"paragraph"}},{"id":"b7d88f1a-81e8-427b-b302-f5d913dbce5d","type":"image","content":{"alt":"Frame 1047.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768310735305-sfb4nj.png","width":null,"fullWidth":true}},{"id":"c7088a81-e289-4d1d-b40b-0f6a06c2d3d5","type":"text","content":{"text":"Contrast","variant":"heading2"}},{"id":"83ebe999-6f41-4fc8-b65c-df8d48110e13","type":"text","content":{"text":"Good contrast ensures text is clear, readable, and accessible across all applications. Text color should always be chosen based on the background tone.<div><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Use white text on darker color values and black text on lighter color values.&nbsp;&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">The switch happens at the midpoint of the color scale.</span></div><div><div><br>Avoid placing text on colors where readability is unclear. When in doubt, choose the option with stronger contrast. Contrast should support clarity first and style second.</div></div>","variant":"paragraph"}},{"id":"82145e3f-b416-451b-96fe-663d15159d21","type":"image","content":{"alt":"Frame 1050.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768312781639-dvk64d.png","width":null,"fullWidth":true}}]},{"id":"ed9bb900-3683-498e-8520-eda98dcf3559","slug":"typography","group":"Design","title":"Typography","blocks":[{"id":"c54d0859-f984-4c38-b4fa-13b38cf77b38","type":"text","content":{"text":"Typography is a core part of the Nobora identity. It shapes how the brand speaks across product, marketing, and social media.&nbsp;<br>","variant":"heading3","hasPadding":true,"backgroundColor":"#f9fafb"}},{"id":"dd2dda79-67aa-4d83-8522-a3cbd946f60e","type":"text","content":{"text":"The type system is designed to be clear, modern, and flexible while remaining consistent everywhere it appears.","variant":"paragraph"}},{"id":"76a2e9db-69c4-4b53-ab81-61aa3290fee0","type":"text","content":{"text":"Zalando Sans is the primary typeface for Nobora.<br><br>It is used across product, marketing, and social media for body text, paragraphs, UI copy, and headings. Its clean structure and strong readability make it suitable for both functional interfaces and expressive brand moments.<br>","variant":"paragraph"}},{"id":"ffa7f423-9b5c-4f61-90ec-8ef5fe6bd1a7","type":"image","content":{"alt":"MacBook Pro 14_ - 2.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768329228096-zm7h9e.png"}},{"id":"883f70bb-bb5e-44fd-90eb-9c78e6b6f2e6","type":"text","content":{"text":"Emphasis Variant","variant":"heading2"}},{"id":"2d9ae60f-bedc-4a1f-bb09-bd22cc09b6a5","type":"text","content":{"text":"Zalando Sans Semi Expanded is the emphasis variant.","variant":"paragraph"}},{"id":"9ed19b79-5b5a-4e87-ba5f-a03915b7e770","type":"text","content":{"text":"<ol><li></li><span style=\"font-weight: normal;\">Zalando Sans Semi Expanded is the emphasis variant.<br><br>It is used to add presence and visual strength without changing the type family. This variant creates emphasis through width rather than weight alone.</span><br><br>Zalando Sans Semi Expanded is used for:<br>hero headlines,<br>titles,<br>brand statements,<br>social media headlines,<br>and key marketing moments.<br><li></li></ol>","variant":"heading4","tightSpacing":true}},{"id":"4e39f11f-1d48-477f-a2b3-e534d2d85e0d","type":"text","content":{"text":"This variant adds presence and confidence to key messages. It is also the variation used in the Nobora logotype, making it suitable for top-level brand moments.","variant":"paragraph"}},{"id":"7bdd6694-0882-40e7-b9c5-9cbda83cbcaf","type":"image","content":{"alt":"MacBook Pro 14_ - 2.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768329681182-4xzryo.png"}},{"id":"fcc94779-ee70-4f1c-a670-54e874b05bb1","type":"text","content":{"text":"Web Usage","variant":"heading2"}},{"id":"02480d69-8e7b-4ece-95c1-a2916aa4704a","type":"text","content":{"text":"<div><font face=\"monospace\">css</font></div><div><font face=\"monospace\"><br></font></div><font face=\"monospace\">/* Body, paragraphs, UI */<br>font-family: \"Zalando Sans\", sans-serif;<br><br>/* Headings and titles */<br>font-family: \"Zalando Sans Semi Expanded\", sans-serif;</font><br>","variant":"paragraph","hasPadding":true,"backgroundColor":"#f3f4f6"}},{"id":"6dab1a6e-c031-4ee6-adee-188274b46b85","type":"text","content":{"text":"Other Width Variations","variant":"heading2"}},{"id":"21b46461-bfa0-427b-820c-3c87a1595d8e","type":"text","content":{"text":"Zalando Sans includes <b>Condensed, Semi Condensed, and Expanded</b> width variations.<div><br></div><div>These variations are not part of the core typography system and should not be used by default.</div>","variant":"paragraph","tightSpacing":true}},{"id":"bdb8cef4-8021-49f6-98dd-9716002388d5","type":"text","content":{"text":"They may only be used in special cases such as","variant":"heading3"}},{"id":"ed905f08-7386-41ab-b977-f96cff0ee33c","type":"text","content":{"text":"<b><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">1. Campaign visuals</span><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">2. Experimental layouts</span><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">3. Space-constrained designs</span></b>","variant":"paragraph"}},{"id":"e4128c3a-5cd0-42c4-a48f-81f48854984c","type":"text","content":{"text":"They should never replace the primary or Semi Expanded styles in core brand or product interfaces.","variant":"paragraph"}},{"id":"802aba2d-4e3b-4ed2-9545-27c678c5f45d","type":"divider","content":{}},{"id":"fad843f8-155e-4d40-8e27-3675701acf2d","type":"text","content":{"text":"Typography hierarchy","variant":"heading2"}},{"id":"71ddeada-3406-4414-b960-7fdf73c6a823","type":"text","content":{"text":"The Nobora type system uses a clear hierarchy to ensure readability and consistency across product, marketing, and social layouts.","variant":"paragraph"}},{"id":"483b6df8-75af-451c-a973-0cb9e3c789f9","type":"text","content":{"text":"Headings","variant":"heading3"}},{"id":"ff90523d-089a-4fbf-a9c0-171c246a1dd8","type":"text","content":{"text":"Headings can use either Zalando Sans or Zalando Sans Semi Expanded.<br><br>Zalando Sans is used for headings in product interfaces, dense layouts, and information-driven content where clarity is the priority.<br><br>Zalando Sans Semi Expanded is used for headings where stronger emphasis or expression is needed, especially in marketing, landing pages, and social media.<br><br>Both styles are correct. The choice depends on tone and context.","variant":"paragraph"}},{"id":"23d48c23-dfc8-46ee-b70e-26fc485ff6bd","type":"imageGrid","content":{"images":[{"alt":"Frame 1060.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768339993088-ndgoa3.png"},{"alt":"Frame 1059.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768340006182-nui8ly.png"}],"aspectRatio":"portrait"}},{"id":"ffa39250-dc01-4e4b-9a40-d06a57b3060c","type":"text","content":{"text":"Body text","variant":"heading3"}},{"id":"05c99277-ccf8-450f-b344-08f150dda142","type":"text","content":{"text":"Body text uses Zalando Sans in its regular width.<br><br>It is used for paragraphs, descriptions, long-form content, and captions. Body text should always prioritize readability and should not use condensed or expanded width variants.","variant":"paragraph"}},{"id":"5f9df2f2-2ee8-4ebe-a95b-ef63916d7e37","type":"image","content":{"alt":"Frame 1061.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768339823117-po3fdm.png"}},{"id":"30c63d8a-4612-43d7-81af-cc53482de5a6","type":"text","content":{"text":"UI Text","variant":"heading3"}},{"id":"89ebbb71-2ac7-45d9-a16d-f49f2b967c3c","type":"text","content":{"text":"UI text uses Zalando Sans in Regular or Medium weights.<br><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">It is used for buttons, labels, navigation items, form fields, and system messages. UI text should remain neutral and supportive and should never compete with headings or emphasis text.</span>","variant":"paragraph","hasPadding":false,"backgroundColor":"transparent"}},{"id":"51cdff20-8d00-4c3d-9219-42eac6b9b8ad","type":"image","content":{"alt":"Frame 1062.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768340579072-p8cns.png","width":1096,"fullWidth":false}},{"id":"98da31b9-c2e9-492c-a62c-1ea1ec639e2a","type":"text","content":{"text":"Captions and metadata","variant":"heading3"}},{"id":"a0bfb923-2c34-4e4c-b501-7d205d03a7e2","type":"text","content":{"text":"Captions and metadata use Zalando Sans.<br><br>They are used for helper text, timestamps, secondary information, and supporting labels. These should feel subtle and clear.","variant":"paragraph"}},{"id":"28a4f7c6-0111-4de7-a718-5049079e6c08","type":"text","content":{"text":"Typography in social media","variant":"heading3"}},{"id":"dbda1a72-3c73-46b3-a8a8-d81d576ffad6","type":"text","content":{"text":"Social media is fast, expressive, and mobile-first.<br><br>Headlines can use Zalando Sans Semi Expanded for strong, attention-grabbing statements or Zalando Sans for calmer, informative messages. Body text and captions always use Zalando Sans to maintain readability on small screens.<br><br>Condensed and expanded variants should be avoided on social media.","variant":"paragraph"}},{"id":"56b32087-f0d6-4905-88fa-d76709bf0605","type":"text","content":{"text":"<span style=\"font-weight: normal;\"><i>Zalando Sans is used for all body text, UI text, captions, and general headings.<br>Zalando Sans Semi Expanded is used for emphasis, titles, hero headlines, and brand-forward moments.</i></span>","variant":"heading3","hasPadding":true,"backgroundColor":"#f9fafb"}},{"id":"8b8357a8-86b4-4fde-95f5-38e8ca9fd2be","type":"imageGrid","content":{"images":[{"alt":"Frame 1063.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768399665515-1g5xrq.png"},{"alt":"Frame 1064.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768399665517-wc7awg.png"}],"aspectRatio":"auto"}}]},{"id":"ae239c46-6b65-45f9-aa16-e21486b49052","slug":"photography","group":"Design","title":"Photography","blocks":[{"id":"1886d2a5-5cfe-4fe1-86e3-c43145b22861","type":"text","content":{"text":"General Principles","variant":"heading2","tightSpacing":true}},{"id":"a5312e35-feb8-4a47-8d0e-39865de1b341","type":"text","content":{"text":"The energy in Nobora photography should showcase the following attributes:<br><br><b>1. Energetic<br>2. Youthful<br>3. Liberating<br>4. Confident<br>5. Human<br>6. In motion</b><br><br>Images should feel alive and unapologetic. They should reflect progress, freedom, and real-world wins. If a photo feels static, polite, or overly polished, it’s not Nobora.","variant":"paragraph","hasPadding":false,"tightSpacing":true,"backgroundColor":"transparent"}},{"id":"d56eb9d4-beed-44c2-bdd7-e1a6adcb03c7","type":"divider","content":{}},{"id":"60ba9a1b-9a8f-4779-a80b-0ef17410d73d","type":"text","content":{"text":"People and lifestyle","variant":"heading2"}},{"id":"34a5b498-9ec2-44ef-abe5-4d8dac9b7aba","type":"text","content":{"text":"Nobora photography focuses on real people in real moments.<br>Not posed. Not staged. Not corporate.<br><br>Think movement, action, and everyday wins enabled by money.<br>","variant":"paragraph"}},{"id":"74aa1738-c99a-4389-8686-62158ae619cd","type":"text","content":{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}},{"id":"db7647e2-8182-4274-a45b-46ce744cd91e","type":"text","content":{"text":"1. People using their phones mid-action<br>2. Friends moving through the city<br>3. Hands, gestures, motion<br>4. Faces optional, emotion essential","variant":"paragraph"}},{"id":"210e1fe1-9229-4715-bd00-80a46c0e75d9","type":"text","content":{"text":"Avoid","variant":"heading3","tightSpacing":true}},{"id":"cc8e75d3-be9a-46fc-9736-f149923f2fb2","type":"text","content":{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Suits, offices, boardrooms</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Forced smiles or posed portraits</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Looking directly at the camera</span></li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"eaba3d46-53f1-46be-88f3-83950ae99eed","type":"imageGrid","content":{"alt":"grok-image-67cab123-f52c-470e-9e71-1c72476b6834.jpg","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768466625920-quv8gq.jpg","width":null,"images":[{"alt":"ChatGPT Image Jan 15, 2026, 09_45_08 AM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768466728844-4byn5.png"},{"alt":"15d5d1ff-68e3-45dd-a12f-859a3eb45127.jpg","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768467022118-pcbb06.jpg"},{"alt":"ChatGPT Image Jan 15, 2026, 10_09_38 AM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768468208589-unm4g1.png"}],"aspectRatio":"auto","tightSpacing":false}},{"id":"79113df4-4da7-4905-ac65-9193cadae898","type":"text","content":{"text":"Team and Culture","variant":"heading2"}},{"id":"1ac99997-1b79-48c7-833f-a731ed4fdeee","type":"text","content":{"text":"When showing the Nobora team, the focus is on energy and culture, not hierarchy.<br>Team photos should feel like a crew, not staff portraits.","variant":"paragraph"}},{"id":"7527fc22-978c-496a-8538-7fcdda645405","type":"text","content":{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}},{"id":"b175ee94-eca4-4917-b833-1ae164b30f05","type":"text","content":{"text":"<ol><li>Casual clothing</li><li>Natural light</li><li>Group moments, not formal lineups</li><li>Behind-the-scenes energy</li></ol>","variant":"paragraph","tightSpacing":true}},{"id":"06ece8c2-0347-4fea-8443-194d770af4c9","type":"text","content":{"text":"Avoid<br>","variant":"heading3","tightSpacing":true}},{"id":"98b1b678-352b-4bc8-a0c1-a4c95a846f5d","type":"text","content":{"text":"<ul><li>Corporate headshots</li><li>Plain studio backdrops</li><li>Formal posture</li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"dfe411d0-cf2a-4616-812c-df61d9fddc54","type":"imageGrid","content":{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 12_20_03 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768476053541-kkv75l.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_13_36 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768476053542-nbafd.png"}],"aspectRatio":"auto"}},{"id":"33b42f54-d0e3-4657-beea-9d2e7fcc4a09","type":"text","content":{"text":"Motion and Momentum","variant":"heading2"}},{"id":"272ca7bb-3a95-4357-82fa-d398b0d39b9a","type":"text","content":{"text":"Movement is central to the Nobora story.<br>Money moves. People move. Life moves.<br><br>Photography should reflect forward motion and momentum.","variant":"paragraph","tightSpacing":true}},{"id":"95f66fff-bf2c-41f1-aa9a-fcd94f54edac","type":"text","content":{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}},{"id":"3ffe6e21-8f14-4ff7-ab55-204c9310131c","type":"text","content":{"text":"<ol><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Walking, running, stepping forward</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Motion blur in backgrounds</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Cropped frames that imply speed</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Transitional moments</span></li></ol>","variant":"paragraph","tightSpacing":true}},{"id":"dd06d387-ed53-4b96-b9ca-82b9cfaa4efe","type":"imageGrid","content":{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 12_40_36 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768477261980-wjl4r.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_33_05 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768477396197-5byti9.png"}],"aspectRatio":"auto"}},{"id":"a7c1fdbf-e297-4e12-9101-147455164608","type":"text","content":{"text":"Events and Campaigns","variant":"heading2"}},{"id":"83c53f71-7073-4235-af41-8c14a22c4f5e","type":"text","content":{"text":"Event photography captures community, movement, and shared wins.<br>These images should feel documentary-style. Real moments. Real reactions. Real energy.","variant":"paragraph","tightSpacing":true}},{"id":"746a4527-edef-468b-8d22-868dcaf691c3","type":"text","content":{"text":"Visual Direction","variant":"heading3","tightSpacing":true}},{"id":"b39c2b45-c4fb-4d63-bb3f-ae97d356b02f","type":"text","content":{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Candid interactions</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">People mid-conversation or action</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Genuine expressions</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Focus on participation, not branding</span></li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"08a7445f-8c68-4770-a6f9-a25baac197d5","type":"text","content":{"text":"Avoid","variant":"heading3","tightSpacing":true}},{"id":"9386b53b-dcfe-486d-b9e7-52ff9e3105a6","type":"text","content":{"text":"Over-branded backdrops<br>Staged group photos<br>Forced poses","variant":"paragraph"}},{"id":"71b6d5be-937d-4cd2-a16a-230ef6fa5614","type":"imageGrid","content":{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 01_00_37 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478470801-gshl9p.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_58_52 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478470802-948bwf.png"}],"aspectRatio":"auto"}},{"id":"9ffab42a-21db-416a-848d-f484afbedba4","type":"text","content":{"text":"Environment and Setting","variant":"heading2"}},{"id":"dea57a4d-112e-4a4f-bef6-207ccc067e92","type":"text","content":{"text":"Nobora lives in the real world.<br><br>Settings should feel urban, everyday, and current. Streets, cafés, transport, outdoor spaces. Places where money actually gets used.","variant":"paragraph"}},{"id":"3f930d08-283b-4e50-b345-090b87a11f8f","type":"text","content":{"text":"Visual Direction","variant":"heading3","tightSpacing":true}},{"id":"a3c43fe2-075c-4e23-b245-0af7cfc6b796","type":"text","content":{"text":"<ul><li>City streets</li><li>Cafés and public spaces</li><li>Transit environments</li><li>Natural, lived-in locations</li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"096accbe-c940-4d5f-962c-76135dad58d8","type":"text","content":{"text":"Avoid","variant":"heading3","tightSpacing":true}},{"id":"e2f5abb4-8eb5-406b-82e2-1cff49549c5e","type":"text","content":{"text":"Generic offices<br>Empty studio spaces<br>Artificial environments","variant":"paragraph"}},{"id":"40d74347-19ba-4a7d-9806-5a6de337ea76","type":"image","content":{"alt":"ChatGPT Image Jan 15, 2026, 12_48_47 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478091157-dc0yn.png"}},{"id":"14bb15b2-a315-42d3-a5f3-ec298998cb3e","type":"text","content":{"text":"Logo Usage in Photography","variant":"heading2"}},{"id":"79233172-9a2a-4563-b2d5-422da777f8c7","type":"text","content":{"text":"The logo should never overpower the image.<br><br>Photography leads. Branding supports.","variant":"paragraph"}},{"id":"08d643f2-d128-46bb-9db0-717de5a3329b","type":"text","content":{"text":"Visual Direction","variant":"heading3","tightSpacing":true}},{"id":"a007287e-73f4-4a7d-b2b3-6e0672009958","type":"text","content":{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Use the logo sparingly</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Keep it small and unobtrusive</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Place it where it doesn’t distract from the moment</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Let the image carry the emotion</span></li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"a67c451b-1831-4018-a036-423fb8769cc8","type":"image","content":{"alt":"Frame 1067.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768480390670-yzh0wr.png"}}]},{"id":"03811259-8dce-4fd1-814a-2bbfd94a61f6","slug":"layouts","group":"Design","title":"Applications","blocks":[{"id":"d19986f8-cd52-4792-9bd9-9c6ad94d9c6f","type":"text","content":{"text":"","variant":"heading2","tightSpacing":true}}]},{"id":"e52697c7-8f19-4664-af11-a28dc49299a7","slug":"illustration","group":"Design","title":"Illustration","blocks":[{"id":"9ebc7701-a473-4347-bc5e-1b142dff8b00","data":{"text":"Be min","variant":"heading2"},"type":"text","content":{"text":"","variant":"heading2","tightSpacing":true}}]},{"id":"d76f7599-28e3-4350-bb34-5a0a53093e3a","slug":"untitled-1769131162815","title":"Untitled Section","blocks":[{"id":"ab7a57a2-50bc-47e5-8c08-395ede087d7d","data":{"text":"","variant":"paragraph"},"type":"text"}]}]}', -- Keep original draft as backup
        '{"tokens":{"logoUrl":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768064345158-ubdv9.png","fontFamily":"Geist","primaryColor":"#091f2b","customFontUrl":null},"sections":[{"id":"cf0422cd-c89a-4ca8-912f-fd1ad1b4ee58","slug":"introduction","group":"Welcome","title":"Welcome","blocks":[{"id":"928a1f8d-81c1-4a98-a5ae-5ef62dd00717","data":{"text":"Who we are","variant":"heading2"},"type":"text","content":{"text":"Introduction","variant":"heading2","tightSpacing":false}},{"id":"3aa3b1df-e880-4230-91bf-d47cb9aa182e","data":{"text":"Nebora is Nigeria''s most intuitive cryptocurrency platform. We''re on a mission to make crypto as simple as mobile banking—because financial empowerment shouldn''t require a computer science degree.","variant":"paragraph"},"type":"text","content":{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\"><ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Your complete resource for building consistent, powerful brand experiences across every touchpoint.</span></li><li>These guidelines ensure that everyone, from our internal teams to external partners, can confidently represent the Nebora brand. Whether you''re designing an app screen, writing a tweet, or creating a presentation, you''ll find everything you need here.</li></ul></p>\n","variant":"paragraph"}},{"id":"ed407ca6-b471-40ff-913d-57b864ae87c1","type":"image","content":{"alt":"Frame 88.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768202772795-z3ymn4.png","width":null,"fullWidth":true}},{"id":"d22a8e68-3eb0-4272-acfb-4ecf9ef2c8e5","type":"text","content":{"text":"Need Help?","variant":"heading3"}},{"id":"f92513db-a121-4eea-90dc-9c27466ae645","type":"text","content":{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Can''t find what you''re looking for? Contact the brand team:</p>\n<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">📧<a class=\"underline underline underline-offset-2 decoration-1 decoration-current/40 hover:decoration-current focus:decoration-current\" href=\"mailto:brand@nebora.com\">brand@nebora.com</a></p>","variant":"paragraph"}}]},{"id":"2f56bb83-e59a-40c9-9830-883eb98128cf","slug":"tone-of-voice","group":"Writing","title":"Tone of voice","blocks":[{"id":"02cffac1-fef1-4cc9-a23f-4af5477799ce","type":"text","content":{"text":"<p data-path-to-node=\"4\"><span style=\"background-color: rgba(0, 0, 0, 0); color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: -0.015em;\">The world of cryptocurrency is often noisy, volatile, and confusing. Nobora is the opposite.&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: -0.2px;\">We are the signal in the noise. We are the stable ground.</span></p>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#eff6ff"}},{"id":"7483cae9-40aa-44da-8785-ef029ab96a64","type":"text","content":{"text":"Our voice is designed to demystify DeFi (Decentralized Finance) for the everyday person. We do not use hype. We do not promise \"to the moon.\" We promise access, ease, and security. We speak with the confidence of a bank but the agility of a tech startup.","variant":"paragraph","tightSpacing":true}},{"id":"252ff695-52b6-42e5-b339-14eddf1d5d96","type":"divider","content":{}},{"id":"2f28c11a-8556-4c46-828d-90b3869eb3b4","type":"text","content":{"text":"How Nebora Speaks","variant":"heading2","tightSpacing":true}},{"id":"ba5bd52b-17cc-4edc-b4d0-1965649cade1","type":"text","content":{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Nebora speaks as a <strong>knowledgeable friend</strong>—confident but never cocky, professional but never cold, expert but never condescending.</p>\n<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Think of us as that friend who really understands crypto and finances, but explains things in a way that makes sense over a beer, not in a boardroom.</p>","variant":"paragraph","tightSpacing":true}},{"id":"ab6d2003-8c44-408c-b053-115f9e4cedb8","type":"text","content":{"text":"1. Bring the Energy.","variant":"heading3"}},{"id":"9d4311aa-9a9d-4794-98da-01db5b7c0550","type":"text","content":{"text":"<p data-path-to-node=\"4\">Money doesn''t have to be boring. We are the spark that gets things moving. Our language is high-voltage and enthusiastic. We don''t just \"process transactions.\" We make things happen. We use punchy sentences and active verbs to keep the momentum going.</p>","variant":"paragraph","tightSpacing":true}},{"id":"68d123a0-763c-475e-af73-4e6dea8539e2","type":"text","content":{"text":"<li><p data-path-to-node=\"7,0,1,0,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"7,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"Your funds have been successfully deposited into your account.\" (Boring)</font></p></li><li><p data-path-to-node=\"7,0,1,1,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"7,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Boom. Your money has landed.\" (Energetic)</font></p></li>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}},{"id":"c8923da8-cc85-4d3c-b6b3-fb7d89b73327","type":"image","content":{"alt":"Frame 92.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768202804260-er76kt.png","fullWidth":false}},{"id":"f6144d94-e553-4995-b608-f3a23690d774","type":"text","content":{"text":"2. Unlock Freedom","variant":"heading3"}},{"id":"78713c50-f4e3-4ad5-bca6-98e79552c552","type":"text","content":{"text":"We are here to break down walls. The old financial system is slow and full of \"no.\" Nobora is full of \"yes.\" We focus on what the user can <i data-path-to-node=\"9\" data-index-in-node=\"139\">do</i> right now. We frame every feature as a superpower that liberates their cash from the digital world into the real world.","variant":"paragraph"}},{"id":"30e31250-de84-4159-9db2-66a6b61269e8","type":"text","content":{"text":"<ul><li><span data-path-to-node=\"10,0,1,0,0\" data-index-in-node=\"0\" style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\">Instead of:</span><span style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\"> \"You can withdraw your crypto to a local bank account.\" (Functional)</span></li><li><span data-path-to-node=\"10,0,1,1,0\" data-index-in-node=\"0\" style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\">Nobora says:</span><span style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\"> \"Crypto to Cash. Spend it anywhere, anytime. You''re free.\" (Liberating)</span></li></ul>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}},{"id":"280649c6-6467-472e-9747-ab330d7f25b6","type":"image","content":{"images":[]}},{"id":"8ce7b197-658e-4e9d-949d-4c6c432a8d2a","type":"text","content":{"text":"3. Keep It Real","variant":"heading3"}},{"id":"ac125184-c3d6-40ea-a380-fadcb65157a2","type":"text","content":{"text":"We don''t talk like a suit. We talk like friends. We are part of the internet culture. We use casual language, relevant slang (when it fits), and a conversational rhythm. We are not trying to impress you with big words. We are trying to vibe with you.","variant":"paragraph"}},{"id":"35376b71-4007-4ede-b321-47f0a698351f","type":"text","content":{"text":"<li><p data-path-to-node=\"13,0,1,0,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"13,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"We offer competitive interest rates on your stablecoin savings.\" (Corporate)</font></p></li><li><p data-path-to-node=\"13,0,1,1,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"13,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Let your money chill and earn. While you sleep, your balance grows.\" (Youthful)</font></p></li>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}},{"id":"52504541-70fd-474c-bcca-14bc2186e2d9","type":"image","content":{}},{"id":"00dfed47-661b-4133-ae46-e1b7c2469270","type":"text","content":{"text":"4. Be Bold and Direct","variant":"heading3"}},{"id":"44227ce9-e519-41a7-a3d4-666d7819364a","type":"text","content":{"text":"Confidence is attractive. We don''t hedge our bets or use timid language. We tell you exactly what to do and what you will get. We use short, imperative headlines that act as a call to adventure rather than just a call to action.","variant":"paragraph"}},{"id":"18f18876-21e8-4e17-b7fe-fe7dd9dfa06b","type":"text","content":{"text":"<li><p data-path-to-node=\"16,0,1,0,0\"><font face=\"monospace\"><b style=\"\"><i style=\"\"><span data-path-to-node=\"16,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"Please sign up to start trading.\" (Polite)</i></b></font></p></li><li><p data-path-to-node=\"16,0,1,1,0\"><font face=\"monospace\"><b style=\"\"><i style=\"\"><span data-path-to-node=\"16,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Get in. Start winning.\" (Bold)</i></b></font></p></li>","variant":"paragraph"}},{"id":"0e67587e-e243-4f86-be36-364d5f0a3ded","type":"image","content":{}},{"id":"90ccb3a7-607d-4780-8b29-26213f9d40e2","type":"text","content":{"text":"5. Celebrate the Wins","variant":"heading3"}},{"id":"82629094-6a67-41e9-9c7f-ac51560795c8","type":"text","content":{"text":"Every saved dollar and every successful swap is a win. We act as the user''s personal hype team. We use positive, affirming language to make financial management feel like a game that they are winning.<div><br><div><li><p data-path-to-node=\"19,0,1,0,0\"><b><i><font face=\"monospace\"><span data-path-to-node=\"19,0,1,0,0\" data-index-in-node=\"0\">Instead of:</span> \"Transaction history updated.\" (System status)</font></i></b></p></li><li><p data-path-to-node=\"19,0,1,1,0\"><b><i><font face=\"monospace\"><span data-path-to-node=\"19,0,1,1,0\" data-index-in-node=\"0\">Nobora says:</span> \"Another smart move. Check out your latest wins.\" (Celebratory)</font></i></b></p></li></div></div>","variant":"paragraph"}},{"id":"2930500c-ba5c-4398-9a46-63dc34738a6a","type":"image","content":{}},{"id":"50cb22f9-b566-4f28-bd65-44f06e99a185","type":"divider","content":{}},{"id":"36aaa73a-173d-4c70-b5da-3a2462e7801e","type":"text","content":{"text":"When to adjust your tone","variant":"heading2","tightSpacing":true}},{"id":"9f85fd41-21cf-4c70-95e3-aa34d7fe82df","type":"text","content":{"text":"While Nobora is always high-energy, we know when to turn the volume up and when to focus on clarity.","variant":"paragraph","tightSpacing":true}},{"id":"99e71a71-dc95-4650-b9ac-77e4ab88c5e6","type":"text","content":{"text":"By Context","variant":"heading3","tightSpacing":false}},{"id":"fc9f9b20-2ee5-45ad-b857-615c8980cea3","type":"text","content":{"text":"<b data-path-to-node=\"21,0,0\" data-index-in-node=\"0\">Social Media (Volume: 10/10):</b> This is our playground. We are the \"Main Character.\" We use memes, trend-jacking, and maximum hype. We celebrate user wins loudly. If the market is crashing, we are the friends cracking a joke to keep spirits high.","variant":"paragraph"}},{"id":"9321b937-47b5-4888-9870-73dd5797aacd","type":"text","content":{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,0,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span> Unfiltered, witty, and loud.</u></i></font>","variant":"paragraph","tightSpacing":true}},{"id":"4f484e39-7d89-41a7-b096-e3eb14fce43c","type":"text","content":{"text":"<b data-path-to-node=\"21,1,0\" data-index-in-node=\"0\">Product &amp; In-App (Volume: 7/10):</b> We keep the energy high, but functionality comes first. We want the user to feel fast and efficient. We use micro-copy that rewards action (\"Nice,\" \"Got it,\" \"Done\").","variant":"paragraph"}},{"id":"02520ef4-7505-44c5-bec7-a6e9e9442ac0","type":"text","content":{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,1,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span> Punchy, encouraging, and frictionless.</u></i></font>","variant":"paragraph","tightSpacing":true}},{"id":"5e1e4709-cf10-41b7-b1d5-97856e2deade","type":"text","content":{"text":"<b data-path-to-node=\"21,2,0\" data-index-in-node=\"0\">Customer Support (Volume: 4/10):</b> When things go wrong, the \"hype\" needs to take a backseat to \"help.\" We drop the slang if it confuses the issue. We are still not corporate robots, though. We are the \"smart friend who knows how to fix it.\" We are calm, capable, and on their side.","variant":"paragraph"}},{"id":"6aa9cb68-fba4-41b3-a14e-3efbb8e2985c","type":"text","content":{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,1,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span>&nbsp;Real, empathetic, and solution-focused.</u></i></font>","variant":"paragraph","tightSpacing":true}},{"id":"7b39a6be-ddea-4137-9835-4cfd9375cefe","type":"text","content":{"text":"By Audience","variant":"heading3"}},{"id":"94fb310a-24d8-45b0-aba8-79da5df2ac45","type":"text","content":{"text":"Audience: The Newbie (Just joined)","variant":"heading3","tightSpacing":true}},{"id":"d8da3766-db4d-4054-8cc5-7e5338a34dbc","type":"text","content":{"text":"<b data-path-to-node=\"9,0,0\" data-index-in-node=\"0\">Mindset:</b> Excited but maybe a little intimidated by crypto.","variant":"paragraph"}},{"id":"0d1691c6-5e66-48bc-af35-9587b8ef9066","type":"text","content":{"text":"<b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Our Tone:</b> The Welcoming Committee. We make them feel like they just joined the coolest club on earth. We emphasize ease and safety.","variant":"paragraph","tightSpacing":true}},{"id":"c6f91cdd-d489-4b1d-9d0a-26af7e876e91","type":"text","content":{"text":"<i><b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Voice:</b>&nbsp;\"You are in. Let''s show you around.\"</i>","variant":"paragraph","tightSpacing":true}},{"id":"0127f692-1430-41fd-b8bf-3fbcdc8c005c","type":"text","content":{"text":"By Audience","variant":"heading3"}},{"id":"1be9953e-a844-4645-b2fa-e83eece76a78","type":"text","content":{"text":"Audience:  The Grinder (Active Trader/Saver)","variant":"heading3","tightSpacing":true}},{"id":"171dd1f2-60a4-4e33-bd2d-967f60adc04f","type":"text","content":{"text":"<b data-path-to-node=\"9,0,0\" data-index-in-node=\"0\">Mindset:</b> Knows the game. Wants speed and results.","variant":"paragraph"}},{"id":"f87668b4-2cde-4240-a3a0-635d6a48eb17","type":"text","content":{"text":"<b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Our Tone:</b> The Hype Man. We validate their moves. We acknowledge their hustle.","variant":"paragraph","tightSpacing":true}},{"id":"1ea3ad39-19bb-474a-86fa-f417e6b257be","type":"text","content":{"text":"<i><b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Voice:</b>&nbsp;\"Market is moving. Good thing you are too.\"</i>","variant":"paragraph","tightSpacing":true}},{"id":"83e487ae-cbd0-423e-ab0a-7c6e256db70c","type":"divider","content":{}},{"id":"63ec208d-9660-4f09-b73c-3ae5f06829b7","type":"text","content":{"text":"Ready-to-use Examples","variant":"heading2"}},{"id":"d22a4334-c684-48b2-ab92-8b6f23a8ce59","type":"text","content":{"text":"Here is how the <b data-path-to-node=\"17\" data-index-in-node=\"16\">Nobora</b> voice translates into actual copy compared to a traditional bank.","variant":"paragraph"}},{"id":"8c485347-5256-4f98-92a0-5d0bb929031e","type":"text","content":{"text":"Headlines","variant":"heading3"}},{"id":"8c7a3167-d363-484b-ad0a-0ff4ca8d8b9d","type":"text","content":{"text":"<li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Your Wallet. On Steroids.</span></li><li><p data-path-to-node=\"2,1,0\">Break Up With Your Bank.</p></li><li><p data-path-to-node=\"2,2,0\">Crypto made for humans. (Finally.)</p></li><li><p data-path-to-node=\"2,3,0\">Stop watching. Start earning.</p></li><li><p data-path-to-node=\"2,4,0\">Your money, moving at the speed of the internet.</p></li><li><p data-path-to-node=\"2,5,0\">The only wallet you actually want to use.</p></li>","variant":"paragraph"}},{"id":"c4fb704c-0a2a-42d4-9651-bd12f780d313","type":"text","content":{"text":"General CTAs (Calls to Action)","variant":"heading3"}},{"id":"cb30ff16-5aeb-4a1a-bf49-27fc406592aa","type":"text","content":{"text":"<li><p data-path-to-node=\"4,0,0\"><span data-path-to-node=\"4,0,0\" data-index-in-node=\"0\">Send It</span></p></li><li><p data-path-to-node=\"4,1,0\"><span data-path-to-node=\"4,1,0\" data-index-in-node=\"0\">Let''s Go</span></p></li><li><p data-path-to-node=\"4,2,0\"><span data-path-to-node=\"4,2,0\" data-index-in-node=\"0\">Get the Alpha</span></p></li><li><p data-path-to-node=\"4,3,0\"><span data-path-to-node=\"4,3,0\" data-index-in-node=\"0\">Secure the Bag</span></p></li><li><p data-path-to-node=\"4,4,0\"><span data-path-to-node=\"4,4,0\" data-index-in-node=\"0\">Start Winning</span></p></li><li><p data-path-to-node=\"4,5,0\"><span data-path-to-node=\"4,5,0\" data-index-in-node=\"0\">Unlock Freedom</span></p></li><li><p data-path-to-node=\"4,6,0\"><span data-path-to-node=\"4,6,0\" data-index-in-node=\"0\">Claim Your Account</span></p></li>","variant":"paragraph"}},{"id":"6f4e112f-265f-4abd-92d4-f2db572356df","type":"text","content":{"text":"Onboarding &amp; Empty States","variant":"heading3"}},{"id":"5f3928f8-4a33-42e4-b010-d6f4810470ae","type":"text","content":{"text":"<li><span data-path-to-node=\"6,0,0\" data-index-in-node=\"0\" style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><b>No Transactions</b></span><b data-path-to-node=\"6,0,0\" data-index-in-node=\"0\" style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">:</b><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"> It''s quiet in here. Too quiet. Make a move.</span></li><li><p data-path-to-node=\"6,1,0\"><b data-path-to-node=\"6,1,0\" data-index-in-node=\"0\">Identity Verification:</b> Let''s make sure you are you. Quick selfie?</p></li><li><p data-path-to-node=\"6,2,0\"><b data-path-to-node=\"6,2,0\" data-index-in-node=\"0\">Account Setup:</b> First things first. Let''s get you set up.</p></li><li><p data-path-to-node=\"6,3,0\"><b data-path-to-node=\"6,3,0\" data-index-in-node=\"0\">Zero Balance:</b> You''re sitting on zero. Let''s fix that.</p></li><li><p data-path-to-node=\"6,4,0\"><b data-path-to-node=\"6,4,0\" data-index-in-node=\"0\">Connect Bank:</b> Link up. Cash in.</p></li>","variant":"paragraph","tightSpacing":true}},{"id":"aa7e7468-101b-4525-88db-e01a0c402786","type":"text","content":{"text":"Feature Descriptions","variant":"heading3"}},{"id":"b65f15c4-c561-4f53-a628-b7747fb914bf","type":"text","content":{"text":"1. The Swap Feature","variant":"heading4","tightSpacing":true}},{"id":"fd85d0d7-77d4-497d-9830-e09c13c8a0c3","type":"text","content":{"text":"<li><p data-path-to-node=\"8,0,0\"><b data-path-to-node=\"8,0,0\" data-index-in-node=\"0\">The Swap:</b> Swap it like it''s hot. Instant trades. Zero stress.</p></li><li><p data-path-to-node=\"8,1,0\"><b data-path-to-node=\"8,1,0\" data-index-in-node=\"0\">Savings:</b> Lazy money is lost money. Put your cash to work while you sleep.</p></li><li><p data-path-to-node=\"8,2,0\"><b data-path-to-node=\"8,2,0\" data-index-in-node=\"0\">Security:</b> Locked down tight. Your keys, your crypto, your peace of mind.</p></li><li><p data-path-to-node=\"8,3,0\"><b data-path-to-node=\"8,3,0\" data-index-in-node=\"0\">Withdrawals:</b> Crypto to Cash. In seconds. Spend it on real life.</p></li><li><p data-path-to-node=\"8,4,0\"><b data-path-to-node=\"8,4,0\" data-index-in-node=\"0\">Market Trends:</b> Don''t guess. We''ve got the cheat codes right here.</p></li>","variant":"paragraph"}},{"id":"957dc720-ed36-4b47-b767-32e1b0c4d242","type":"text","content":{"text":"Social Media Captions","variant":"heading3","tightSpacing":false}},{"id":"5b86b44d-dd58-4dbb-99a5-bf9fb5a5d50b","type":"text","content":{"text":"<li><p data-path-to-node=\"10,0,0\"><b data-path-to-node=\"10,0,0\" data-index-in-node=\"0\">Market Dip:</b> Red charts? Discount shopping day. 🛒</p></li><li><p data-path-to-node=\"10,1,0\"><b data-path-to-node=\"10,1,0\" data-index-in-node=\"0\">New Feature:</b> You asked. We listened. Then we built it. Drop 2.0 is live. 🔥</p></li><li><p data-path-to-node=\"10,2,0\"><b data-path-to-node=\"10,2,0\" data-index-in-node=\"0\">Community Love:</b> Shoutout to everyone holding through the weekend. We see you. 👀</p></li><li><p data-path-to-node=\"10,3,0\"><b data-path-to-node=\"10,3,0\" data-index-in-node=\"0\">Motivation:</b> If you were waiting for a sign to start, this is it. 🚀</p></li><li><p data-path-to-node=\"10,4,0\"><b data-path-to-node=\"10,4,0\" data-index-in-node=\"0\">Lifestyle:</b> Coffee paid for by crypto yields. The best kind of morning. ☕️</p></li><li><p data-path-to-node=\"10,5,0\"><b data-path-to-node=\"10,5,0\" data-index-in-node=\"0\">Speed:</b> Faster than your bank. Smoother than your ex. Try Nobora.</p></li>","variant":"paragraph"}}]},{"id":"243d2756-ae1b-4025-9be5-8c0c247fc83c","slug":"logos","group":"Design","title":"Logos","blocks":[{"id":"3b3bf8c1-1530-4318-b6ec-054e45bbd100","type":"text","content":{"text":"The badge of the New Era","variant":"heading2"}},{"id":"a131153b-a83c-4fc0-a3c5-31617ceb4f80","type":"text","content":{"text":"<p data-start=\"192\" data-end=\"219\">This is the face of Nobora.</p>\n<p data-start=\"221\" data-end=\"465\">It represents movement, progress, and money that doesn’t stay stuck.&nbsp;</p>","variant":"heading3","tightSpacing":true}},{"id":"4e4fad33-39fc-4cfb-b3f0-36f939374a14","type":"text","content":{"text":"The logo is designed to feel modern, fast, and optimistic. It should always feel clear, confident, and easy to recognize, whether it’s on an app icon or a full website header.<br>","variant":"paragraph"}},{"id":"cec57889-5426-4d9a-86dd-4e2cedc3432f","type":"image","content":{"alt":"Frame 94.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768205604627-gk94cj.png","width":null,"caption":"Nobora Logo","fullWidth":false}},{"id":"5543d087-b441-4684-9ad3-a8eed10d8760","type":"text","content":{"text":"Logotype","variant":"heading2"}},{"id":"18891b78-4474-4b21-8304-974bbe7a94ac","type":"text","content":{"text":"<p data-start=\"636\" data-end=\"674\">The word <b>“nobora”</b> is set in lowercase.</p>\n<p data-start=\"676\" data-end=\"900\">Lowercase keeps the brand approachable and modern. It feels open, friendly, and digital-first, not rigid or institutional. The type is clean and simple, so it stays readable at any size, from a phone screen to a large banner.</p><p data-start=\"676\" data-end=\"900\"><br></p><p data-start=\"676\" data-end=\"900\">The <b>Logotype and Icon</b> are designed to be used as a unit. We have optically adjusted the lettering for a specific rhythm, so please use the official logo files instead of typing the name manually. However, in body copy or live web text, type the name using the font.</p>","variant":"paragraph"}},{"id":"f62a1648-40d2-423b-a31b-dc61fb879e64","type":"text","content":{"text":"Use the wordmark when:","variant":"heading3","tightSpacing":true}},{"id":"df046795-45d2-43ff-8cfb-23906b5ff467","type":"text","content":{"text":"<p data-start=\"902\" data-end=\"924\"><span style=\"background-color: transparent; font-family: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit;\"><i>Introducing the brand</i></span></p><ul data-start=\"925\" data-end=\"1027\"><li data-start=\"949\" data-end=\"982\"><p data-start=\"951\" data-end=\"982\"><i>Clarity matters more than speed</i></p></li><li data-start=\"983\" data-end=\"1027\"><p data-start=\"985\" data-end=\"1027\"><i>There’s enough space to show the full name</i></p></li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"a85a4eb5-d6ad-43b9-b77a-8f61c5bfc0f4","type":"image","content":{"alt":"Frame 100.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768212431196-sfp8yn.png"}},{"id":"84cd6513-ef29-418b-a738-7b402310c68b","type":"text","content":{"text":"Logomark (Icon)","variant":"heading2"}},{"id":"174f266a-b042-4b3e-8264-fed21eb00761","type":"text","content":{"text":"<p data-start=\"1054\" data-end=\"1157\">The icon is built from the letter <strong data-start=\"1088\" data-end=\"1093\">N</strong>, combined with a directional takeoff shape that forms an arrow.&nbsp;<span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">It communicates&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">forward movement,&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">growth, and t</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">ransition from local to global money.</span></p><p data-start=\"1159\" data-end=\"1175\"><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></p>\n<p data-start=\"1251\" data-end=\"1405\">The arrow cutting through the form gives the logo energy. It feels like motion, not a static badge. This makes the icon strong enough to stand on its own.&nbsp;</p>","variant":"paragraph"}},{"id":"67350716-5c4e-43a8-9883-7b520282ea1b","type":"text","content":{"text":"Use the icon when","variant":"heading3","tightSpacing":true}},{"id":"ec8b34f4-eb2c-4db7-8de2-3d5ba2cf4f5a","type":"text","content":{"text":"<li data-start=\"1426\" data-end=\"1444\"><p data-start=\"1428\" data-end=\"1444\"><i>Space is limited</i></p>\n</li>\n<li data-start=\"1445\" data-end=\"1476\">\n<p data-start=\"1447\" data-end=\"1476\"><i>The brand is already familiar</i></p>\n</li>\n<li data-start=\"1477\" data-end=\"1507\">\n<p data-start=\"1479\" data-end=\"1507\"><i>Speed and recognition matter</i></p></li>","variant":"paragraph"}},{"id":"21a5dc40-e465-47d3-806a-0d99030ac6ba","type":"imageGrid","content":{"images":[{"alt":"Frame 93.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206144464-k8d8wk.png"},{"alt":"Frame 95.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206144464-ylf7fr.png"}],"aspectRatio":"square"}},{"id":"ae8073d9-b053-4d9f-a41a-0cc83cf66f79","type":"text","content":{"text":"Logo Usage Guidelines","variant":"heading2"}},{"id":"fc666015-3aa3-4bf7-981a-e9f0fe3b3cf3","type":"text","content":{"text":"Use the Nobora logo clearly and consistently. When in doubt, keep it simple and&nbsp;<div>high-contrast.</div>","variant":"paragraph","tightSpacing":true}},{"id":"ffa62b44-bc70-492a-8226-edd7630d87ab","type":"imageGrid","content":{"images":[{"alt":"Frame 96.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511854-8r7x6d.png","caption":"Dark Background"},{"alt":"Frame 97.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511855-3qd8e.png","caption":"Blue Background"},{"alt":"Frame 99.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511855-w5xiha.png","caption":"Orange Background"}],"aspectRatio":"auto","tightSpacing":true}},{"id":"9ad4dd89-3da5-4999-9f3b-054e77620bc1","type":"text","content":{"text":"Primary Logo Usage&nbsp;","variant":"heading3"}},{"id":"6d02b4e7-0598-46d5-a308-4f0567969ce6","type":"text","content":{"text":"<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">The </span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>Nobora blue</b></span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"> logos are the default and primary expression of the Nobora brand.</span></div><br><b>They represent:</b><br><ul><li>Trust</li><li>Stability</li><li>Credibility</li><li>“Signal in the noise”</li></ul><div><b><br></b></div><div><b>Rule:</b></div><div>When in doubt, use the <b>Nobora blue</b> logo.<br>Product UI,s website headers, formal communications, partnerships, and anything trust-critical must use the blue logo.<br></div>","variant":"paragraph"}},{"id":"f594a4f5-315b-4af9-8f5f-80604ad2d260","type":"text","content":{"text":"Secondary Logo Usage&nbsp;","variant":"heading3"}},{"id":"a124eea5-b244-4581-ac18-0381ced65a1e","type":"text","content":{"text":"<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"></span></div>The orange logo is <b>allowed</b>, but it is not a <b>replacement</b> for the primary logo.<br><br>Orange is expressive, energetic, and attention-grabbing. That makes it powerful but dangerous if overused.<br><br><b>When orange is appropriate</b><br><ul><li>Orange logo can be used in:</li><li>Campaigns and launches</li><li>Social media posts</li><li>Marketing moments</li><li>Celebratory states</li><li>Short-lived visuals</li><li>High-energy brand expressions</li></ul><br><b>Think movement, momentum, </b>and<b> wins, </b>not<b> infrastructure.</b><div><br></div>","variant":"paragraph"}},{"id":"10d48209-f557-4770-9034-8b2a06792f88","type":"text","content":{"text":"Minimum Size","variant":"heading2"}},{"id":"bcbe6268-99d6-4eb1-aff0-be2569d9110b","type":"text","content":{"text":"To ensure legibility across all digital devices, the full logo lockup must maintain a minimum width of&nbsp;<strong>126 pixels</strong>. Scaling below this size compromises readability and is not permitted.","variant":"paragraph"}},{"id":"4f4430ac-f4da-4877-b6a7-5455f368ce73","type":"image","content":{"alt":"Frame 102.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768218614275-plq9f5.png","caption":"Minimum size lockup"}},{"id":"e45be41c-c811-42a6-97e2-f83105ad9dfb","type":"text","content":{"text":"Logo Positioning","variant":"heading2"}},{"id":"8b6db0c3-314d-4b9a-8ab5-8dc3ff455680","type":"text","content":{"text":"<b data-path-to-node=\"6,0\" data-index-in-node=\"0\">The Default:</b> Place the logo in the <b data-path-to-node=\"6,0\" data-index-in-node=\"35\">Top Left</b>.\n<b data-path-to-node=\"6,0\" data-index-in-node=\"45\">The Backup:</b> If the design requires a different layout, refer to the visual guide below for approved positions.","variant":"paragraph"}},{"id":"703ff7ec-510e-472c-b09c-435e92c4cff0","type":"image","content":{"alt":"Frame 101.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768219607497-tny2a9.png","caption":"Logo positioning "}},{"id":"909b5f2f-9a18-4aaa-9039-6ba3838f0129","type":"text","content":{"text":"Clear Space","variant":"heading2"}},{"id":"c5f62bf5-fb39-48b8-acd2-048ad18e42fb","type":"text","content":{"text":"<p data-start=\"127\" data-end=\"220\">Always leave enough clear space around the Nobora logo so it remains legible and uncluttered.</p>\n<p data-start=\"222\" data-end=\"359\">The minimum clear space is defined by the height of the <strong data-start=\"278\" data-end=\"285\">“n”</strong> in the wordmark. This space should be kept free on all sides of the logo.</p>\n<p data-start=\"361\" data-end=\"423\">No text, images, UI elements, or edges should enter this area.</p>\n<p data-start=\"425\" data-end=\"521\">Clear space protects the logo’s visibility and ensures it always feels intentional, not crowded.</p>","variant":"paragraph"}},{"id":"b8cd1870-eaf4-4fb3-9571-d766db07da84","type":"image","content":{"alt":"Frame 103.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768220814705-ykpsf7.png","caption":"Clear space"}},{"id":"f2cdc7a2-0ad3-4f20-94fa-ace7996185d1","type":"text","content":{"text":"Logo Don''ts","variant":"heading2"}},{"id":"3d2e6798-140a-4fb4-b7be-e1061e4eb6fa","type":"text","content":{"text":"To maintain brand integrity, strictly use the provided master artwork files. Ensure the logo stands out clearly against its background and never alter, stretch, or distort the file.","variant":"paragraph"}},{"id":"0c2b4b4b-a7a3-4fd0-bdd0-337ad40d943a","type":"imageGrid","content":{"images":[{"alt":"Frame 104.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978735-vahmb.png","caption":"","description":"Don''t warp or distort our logo in any way "},{"alt":"Frame 105.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-p2zu2.png","description":"Don''t rotate any of our logo"},{"alt":"Frame 106.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-h64sec.png","caption":"","description":"Don''t use other typefaces as a replacement for our logo"},{"alt":"Frame 107.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-syy83y.png","description":"Don''t change the logo colors"},{"alt":"Frame 108.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-j0nl59.png","description":"Don''t add gradients to our logo"},{"alt":"Frame 109.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-fv3r2.png","description":"Don''t crop the logo"},{"alt":"Frame 110.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-o99r4c.png","description":"Don''t add any effects to the logo"},{"alt":"Frame 111.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-ufyns.png","description":"Don''t add any visual elements to our logo"}],"aspectRatio":"landscape"}},{"id":"86777834-e555-493c-a6f3-1c3211a01830","type":"text","content":{"text":"App Icon","variant":"heading2"}},{"id":"cc423a48-773d-4f86-b1c2-74418eeaeb64","type":"text","content":{"text":"Just the Mark. The Blue Arrow centered on Deep Navy. It stands out on any home screen. Tap it to unlock freedom.","variant":"paragraph"}},{"id":"9fb9686a-d134-4469-9813-11335bbf485e","type":"imageGrid","content":{"alt":"Frame 102j.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768228690281-hlwb9c.png","images":[{"alt":"Frame 113.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768229054509-6b9ze5.png"},{"alt":"Frame 1029.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768229202483-ixvj1.png"}],"aspectRatio":"square"}}],"subsections":[{"id":"e394c2de-725b-4430-bf7b-9e8a7787725b","title":"Our logo","blocks":[{"id":"604ff11d-b234-4c26-b965-1fc089230713","type":"text","content":{"text":"Primary Logo","variant":"heading2"}},{"id":"cb2b0d3a-afad-4244-8653-4450142a5500","type":"text","content":{"text":"Use this logo in most applications.","variant":"paragraph"}}]},{"id":"fb551efc-a235-4ad1-9df1-0f99127d733c","title":"Logo positioning","blocks":[{"id":"5951615a-7b3a-4464-8a6f-e9e283ba0663","type":"text","content":{"text":"Clearspace","variant":"heading2"}},{"id":"88534dcd-ba8d-47a9-b72d-edbdc066f112","type":"text","content":{"text":"Always maintain clear space around the logo.","variant":"paragraph"}}]}]},{"id":"9d6c68cf-0619-4023-a356-1394879da831","slug":"colors","group":"Design","title":"Colors","blocks":[{"id":"f225d520-e4d3-4ec8-820f-78a3894c8f62","type":"text","content":{"text":"Color is a core part of the Nobora identity. It sets the mood, builds recognition, and helps the brand feel confident and modern across every touchpoint.","variant":"heading3","tightSpacing":true}},{"id":"ee3761ba-5927-441d-a8f4-4b491512f3a8","type":"text","content":{"text":"The primary colors define the brand’s foundation and should be used most often. Secondary and accent colors support the system by adding flexibility, hierarchy, and emphasis where needed.&nbsp;<div><br></div><div>&nbsp;Used consistently, the color palette ensures Nobora feels clear, energetic, and recognizable across product, marketing, and social media.</div>","variant":"paragraph"}},{"id":"609e9ad8-9948-4bce-8347-4962c18d1bca","type":"text","content":{"text":"Primary Colors","variant":"heading2"}},{"id":"6190b1fc-950c-4d9e-bea0-bc59b65ee109","type":"text","content":{"text":"The primary colors form the foundation of the Nobora brand. They appear most often across product, marketing, and digital experiences.&nbsp;<div><br></div><div><b>Midnight Navy&nbsp;</b></div><div>This is the anchor color of the brand. It brings depth, stability, and trust. Use it for core surfaces, dark backgrounds, headers, and product environments where clarity and focus are needed.&nbsp;</div><div><br></div><div><b>Royal Blue</b></div><div>This is the main brand expression color. It feels modern, confident, and energetic. Use it for key sections, highlights, interactive elements, and brand-forward moments.</div><div><br></div><div>Primary colors should dominate most layouts and always feel intentional and balanced.</div>","variant":"paragraph"}},{"id":"c59a993c-d613-4ceb-971c-1b4239da765e","type":"image","content":{"alt":"MacBook Pro 14_ - 7.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768309427199-u7ea4.png","width":null,"fullWidth":true}},{"id":"cca32c45-dfd4-4167-82ea-9aeb9fbbea3a","type":"text","content":{"text":"Secondary Colors","variant":"heading2"}},{"id":"29f2e83a-654c-45b2-aa5c-110b945c2d4a","type":"text","content":{"text":"Secondary colors support the primary palette by adding contrast, emphasis, and flexibility.","variant":"paragraph","tightSpacing":true}},{"id":"4f35796f-daae-4f4e-a1a5-174dbe999baf","type":"text","content":{"text":"<b>Signal Orange</b><div>This is the accent color. It introduces energy and urgency and should be used sparingly. Use it for calls to action, notifications, highlights, and moments that need attention.&nbsp;</div><div><br></div><div><b>Soft Ivory</b></div><div>This is a neutral support color. It provides breathing space and balance, helping layouts feel clean and readable. Use it for backgrounds, content areas, and to soften bold compositions.&nbsp;</div><div><br></div><div>Secondary colors should never overpower the primary colors. They exist to support, not lead.</div>","variant":"paragraph"}},{"id":"f1037ce8-5377-4edf-a933-c2c991c58660","type":"text","content":{"text":"Accent Colors","variant":"heading2"}},{"id":"2ff2fa88-55f0-4cf7-80cf-4e7190e5a2ee","type":"text","content":{"text":"Accent colors are used to add energy, personality, and emphasis across the Nobora brand. They bring moments to life without overpowering the core palette.\n\nAccent colors should be used sparingly and intentionally.&nbsp;<div><br></div><div>They are not meant to replace the primary colors, but to support them by drawing attention to key actions, highlights, or expressive moments.&nbsp;</div><div><br></div><div><b>Use accent colors for</b></div><div>1. Callouts and highlights</div><div>2. Illustrations and graphic elements</div><div>3. Badges, states, and promotional moments</div><div>4. Social media and campaign visuals</div>","variant":"paragraph","tightSpacing":true}},{"id":"2ddb41a7-a2da-4f20-842b-ff7ae065cf64","type":"image","content":{"alt":"Frame 1037.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768309449656-v97spj.png","width":null,"fullWidth":true}},{"id":"f8614d69-8c91-44da-87ce-958acbcc223f","type":"text","content":{"text":"Accent Color Groups","variant":"heading3"}},{"id":"adc9b1d6-df0e-4519-b71f-b4bca8aa0817","type":"text","content":{"text":"Accent colors are grouped by hue to keep the system simple and flexible. Each group includes a stronger tone and a softer supporting tone.&nbsp;<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b><br></b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>1. Accent Greens</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for growth, success states, highlights, and energetic moments.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>2. Accent Pinks</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for expressive, playful, or human-focused moments.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>3. Accent Yellows</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for attention, optimism, and emphasis.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>4. Accent Teals</b></span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">&nbsp;</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for calm, balance, and supportive accents.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>5. Accent Neutrals</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for warmth, softness, and subtle contrast. These support layouts without drawing attention.</span></div>","variant":"paragraph"}},{"id":"d6bc2bb8-5eb7-4f4c-9764-c612970c3f2f","type":"text","content":{"text":"Avoid using multiple accent colors in a single layout unless there is a clear reason. Too many accents reduce clarity and weaken impact.&nbsp;<div><br></div><div><i style=\"\">When in doubt, lead with the primary colors and let accent colors do the talking in small, focused moments.</i></div>","variant":"heading3"}},{"id":"34d61be3-7be5-4da9-bcd3-658921130cdb","type":"divider","content":{}},{"id":"0442de06-9da8-4f2f-9dd9-4e82ff399045","type":"text","content":{"text":"Tints","variant":"heading2"}},{"id":"f2c98d75-8091-4196-be21-e532bf8ddf67","type":"text","content":{"text":"Tints are lighter versions of a base color, created by mixing the color with white.\n\nThey are primarily used for backgrounds, surfaces, and soft UI states. Tints help create breathing space, improve readability, and keep layouts feeling light and open.\n\nUse tints to support content, not to draw attention.","variant":"paragraph"}},{"id":"49725746-c5f9-42d0-8e7f-a11d22442fcc","type":"image","content":{"alt":"Frame 1049.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768310709978-71eydc.png","width":null,"fullWidth":true}},{"id":"cb2cadc1-6290-4a92-b26b-e27a7b515c1f","type":"text","content":{"text":"Shades","variant":"heading2"}},{"id":"cf27ad92-1e47-4144-8c97-892858f32ce6","type":"text","content":{"text":"Shades are darker versions of a base color, created by mixing the color with black.\n\nThey are used for emphasis, depth, and contrast. Shades work well for dark backgrounds, overlays, and strong interactive or focus states.\n\nUse shades to establish hierarchy and guide attention.","variant":"paragraph"}},{"id":"b7d88f1a-81e8-427b-b302-f5d913dbce5d","type":"image","content":{"alt":"Frame 1047.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768310735305-sfb4nj.png","width":null,"fullWidth":true}},{"id":"c7088a81-e289-4d1d-b40b-0f6a06c2d3d5","type":"text","content":{"text":"Contrast","variant":"heading2"}},{"id":"83ebe999-6f41-4fc8-b65c-df8d48110e13","type":"text","content":{"text":"Good contrast ensures text is clear, readable, and accessible across all applications. Text color should always be chosen based on the background tone.<div><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Use white text on darker color values and black text on lighter color values.&nbsp;&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">The switch happens at the midpoint of the color scale.</span></div><div><div><br>Avoid placing text on colors where readability is unclear. When in doubt, choose the option with stronger contrast. Contrast should support clarity first and style second.</div></div>","variant":"paragraph"}},{"id":"82145e3f-b416-451b-96fe-663d15159d21","type":"image","content":{"alt":"Frame 1050.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768312781639-dvk64d.png","width":null,"fullWidth":true}}]},{"id":"ed9bb900-3683-498e-8520-eda98dcf3559","slug":"typography","group":"Design","title":"Typography","blocks":[{"id":"c54d0859-f984-4c38-b4fa-13b38cf77b38","type":"text","content":{"text":"Typography is a core part of the Nobora identity. It shapes how the brand speaks across product, marketing, and social media.&nbsp;<br>","variant":"heading3","hasPadding":true,"backgroundColor":"#f9fafb"}},{"id":"dd2dda79-67aa-4d83-8522-a3cbd946f60e","type":"text","content":{"text":"The type system is designed to be clear, modern, and flexible while remaining consistent everywhere it appears.","variant":"paragraph"}},{"id":"76a2e9db-69c4-4b53-ab81-61aa3290fee0","type":"text","content":{"text":"Zalando Sans is the primary typeface for Nobora.<br><br>It is used across product, marketing, and social media for body text, paragraphs, UI copy, and headings. Its clean structure and strong readability make it suitable for both functional interfaces and expressive brand moments.<br>","variant":"paragraph"}},{"id":"ffa7f423-9b5c-4f61-90ec-8ef5fe6bd1a7","type":"image","content":{"alt":"MacBook Pro 14_ - 2.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768329228096-zm7h9e.png"}},{"id":"883f70bb-bb5e-44fd-90eb-9c78e6b6f2e6","type":"text","content":{"text":"Emphasis Variant","variant":"heading2"}},{"id":"2d9ae60f-bedc-4a1f-bb09-bd22cc09b6a5","type":"text","content":{"text":"Zalando Sans Semi Expanded is the emphasis variant.","variant":"paragraph"}},{"id":"9ed19b79-5b5a-4e87-ba5f-a03915b7e770","type":"text","content":{"text":"<ol><li></li><span style=\"font-weight: normal;\">Zalando Sans Semi Expanded is the emphasis variant.<br><br>It is used to add presence and visual strength without changing the type family. This variant creates emphasis through width rather than weight alone.</span><br><br>Zalando Sans Semi Expanded is used for:<br>hero headlines,<br>titles,<br>brand statements,<br>social media headlines,<br>and key marketing moments.<br><li></li></ol>","variant":"heading4","tightSpacing":true}},{"id":"4e39f11f-1d48-477f-a2b3-e534d2d85e0d","type":"text","content":{"text":"This variant adds presence and confidence to key messages. It is also the variation used in the Nobora logotype, making it suitable for top-level brand moments.","variant":"paragraph"}},{"id":"7bdd6694-0882-40e7-b9c5-9cbda83cbcaf","type":"image","content":{"alt":"MacBook Pro 14_ - 2.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768329681182-4xzryo.png"}},{"id":"fcc94779-ee70-4f1c-a670-54e874b05bb1","type":"text","content":{"text":"Web Usage","variant":"heading2"}},{"id":"02480d69-8e7b-4ece-95c1-a2916aa4704a","type":"text","content":{"text":"<div><font face=\"monospace\">css</font></div><div><font face=\"monospace\"><br></font></div><font face=\"monospace\">/* Body, paragraphs, UI */<br>font-family: \"Zalando Sans\", sans-serif;<br><br>/* Headings and titles */<br>font-family: \"Zalando Sans Semi Expanded\", sans-serif;</font><br>","variant":"paragraph","hasPadding":true,"backgroundColor":"#f3f4f6"}},{"id":"6dab1a6e-c031-4ee6-adee-188274b46b85","type":"text","content":{"text":"Other Width Variations","variant":"heading2"}},{"id":"21b46461-bfa0-427b-820c-3c87a1595d8e","type":"text","content":{"text":"Zalando Sans includes <b>Condensed, Semi Condensed, and Expanded</b> width variations.<div><br></div><div>These variations are not part of the core typography system and should not be used by default.</div>","variant":"paragraph","tightSpacing":true}},{"id":"bdb8cef4-8021-49f6-98dd-9716002388d5","type":"text","content":{"text":"They may only be used in special cases such as","variant":"heading3"}},{"id":"ed905f08-7386-41ab-b977-f96cff0ee33c","type":"text","content":{"text":"<b><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">1. Campaign visuals</span><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">2. Experimental layouts</span><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">3. Space-constrained designs</span></b>","variant":"paragraph"}},{"id":"e4128c3a-5cd0-42c4-a48f-81f48854984c","type":"text","content":{"text":"They should never replace the primary or Semi Expanded styles in core brand or product interfaces.","variant":"paragraph"}},{"id":"802aba2d-4e3b-4ed2-9545-27c678c5f45d","type":"divider","content":{}},{"id":"fad843f8-155e-4d40-8e27-3675701acf2d","type":"text","content":{"text":"Typography hierarchy","variant":"heading2"}},{"id":"71ddeada-3406-4414-b960-7fdf73c6a823","type":"text","content":{"text":"The Nobora type system uses a clear hierarchy to ensure readability and consistency across product, marketing, and social layouts.","variant":"paragraph"}},{"id":"483b6df8-75af-451c-a973-0cb9e3c789f9","type":"text","content":{"text":"Headings","variant":"heading3"}},{"id":"ff90523d-089a-4fbf-a9c0-171c246a1dd8","type":"text","content":{"text":"Headings can use either Zalando Sans or Zalando Sans Semi Expanded.<br><br>Zalando Sans is used for headings in product interfaces, dense layouts, and information-driven content where clarity is the priority.<br><br>Zalando Sans Semi Expanded is used for headings where stronger emphasis or expression is needed, especially in marketing, landing pages, and social media.<br><br>Both styles are correct. The choice depends on tone and context.","variant":"paragraph"}},{"id":"23d48c23-dfc8-46ee-b70e-26fc485ff6bd","type":"imageGrid","content":{"images":[{"alt":"Frame 1060.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768339993088-ndgoa3.png"},{"alt":"Frame 1059.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768340006182-nui8ly.png"}],"aspectRatio":"portrait"}},{"id":"ffa39250-dc01-4e4b-9a40-d06a57b3060c","type":"text","content":{"text":"Body text","variant":"heading3"}},{"id":"05c99277-ccf8-450f-b344-08f150dda142","type":"text","content":{"text":"Body text uses Zalando Sans in its regular width.<br><br>It is used for paragraphs, descriptions, long-form content, and captions. Body text should always prioritize readability and should not use condensed or expanded width variants.","variant":"paragraph"}},{"id":"5f9df2f2-2ee8-4ebe-a95b-ef63916d7e37","type":"image","content":{"alt":"Frame 1061.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768339823117-po3fdm.png"}},{"id":"30c63d8a-4612-43d7-81af-cc53482de5a6","type":"text","content":{"text":"UI Text","variant":"heading3"}},{"id":"89ebbb71-2ac7-45d9-a16d-f49f2b967c3c","type":"text","content":{"text":"UI text uses Zalando Sans in Regular or Medium weights.<br><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">It is used for buttons, labels, navigation items, form fields, and system messages. UI text should remain neutral and supportive and should never compete with headings or emphasis text.</span>","variant":"paragraph","hasPadding":false,"backgroundColor":"transparent"}},{"id":"51cdff20-8d00-4c3d-9219-42eac6b9b8ad","type":"image","content":{"alt":"Frame 1062.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768340579072-p8cns.png","width":1096,"fullWidth":false}},{"id":"98da31b9-c2e9-492c-a62c-1ea1ec639e2a","type":"text","content":{"text":"Captions and metadata","variant":"heading3"}},{"id":"a0bfb923-2c34-4e4c-b501-7d205d03a7e2","type":"text","content":{"text":"Captions and metadata use Zalando Sans.<br><br>They are used for helper text, timestamps, secondary information, and supporting labels. These should feel subtle and clear.","variant":"paragraph"}},{"id":"28a4f7c6-0111-4de7-a718-5049079e6c08","type":"text","content":{"text":"Typography in social media","variant":"heading3"}},{"id":"dbda1a72-3c73-46b3-a8a8-d81d576ffad6","type":"text","content":{"text":"Social media is fast, expressive, and mobile-first.<br><br>Headlines can use Zalando Sans Semi Expanded for strong, attention-grabbing statements or Zalando Sans for calmer, informative messages. Body text and captions always use Zalando Sans to maintain readability on small screens.<br><br>Condensed and expanded variants should be avoided on social media.","variant":"paragraph"}},{"id":"56b32087-f0d6-4905-88fa-d76709bf0605","type":"text","content":{"text":"<span style=\"font-weight: normal;\"><i>Zalando Sans is used for all body text, UI text, captions, and general headings.<br>Zalando Sans Semi Expanded is used for emphasis, titles, hero headlines, and brand-forward moments.</i></span>","variant":"heading3","hasPadding":true,"backgroundColor":"#f9fafb"}},{"id":"8b8357a8-86b4-4fde-95f5-38e8ca9fd2be","type":"imageGrid","content":{"images":[{"alt":"Frame 1063.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768399665515-1g5xrq.png"},{"alt":"Frame 1064.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768399665517-wc7awg.png"}],"aspectRatio":"auto"}}]},{"id":"ae239c46-6b65-45f9-aa16-e21486b49052","slug":"photography","group":"Design","title":"Photography","blocks":[{"id":"1886d2a5-5cfe-4fe1-86e3-c43145b22861","type":"text","content":{"text":"General Principles","variant":"heading2","tightSpacing":true}},{"id":"a5312e35-feb8-4a47-8d0e-39865de1b341","type":"text","content":{"text":"The energy in Nobora photography should showcase the following attributes:<br><br><b>1. Energetic<br>2. Youthful<br>3. Liberating<br>4. Confident<br>5. Human<br>6. In motion</b><br><br>Images should feel alive and unapologetic. They should reflect progress, freedom, and real-world wins. If a photo feels static, polite, or overly polished, it’s not Nobora.","variant":"paragraph","hasPadding":false,"tightSpacing":true,"backgroundColor":"transparent"}},{"id":"d56eb9d4-beed-44c2-bdd7-e1a6adcb03c7","type":"divider","content":{}},{"id":"60ba9a1b-9a8f-4779-a80b-0ef17410d73d","type":"text","content":{"text":"People and lifestyle","variant":"heading2"}},{"id":"34a5b498-9ec2-44ef-abe5-4d8dac9b7aba","type":"text","content":{"text":"Nobora photography focuses on real people in real moments.<br>Not posed. Not staged. Not corporate.<br><br>Think movement, action, and everyday wins enabled by money.<br>","variant":"paragraph"}},{"id":"74aa1738-c99a-4389-8686-62158ae619cd","type":"text","content":{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}},{"id":"db7647e2-8182-4274-a45b-46ce744cd91e","type":"text","content":{"text":"1. People using their phones mid-action<br>2. Friends moving through the city<br>3. Hands, gestures, motion<br>4. Faces optional, emotion essential","variant":"paragraph"}},{"id":"210e1fe1-9229-4715-bd00-80a46c0e75d9","type":"text","content":{"text":"Avoid","variant":"heading3","tightSpacing":true}},{"id":"cc8e75d3-be9a-46fc-9736-f149923f2fb2","type":"text","content":{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Suits, offices, boardrooms</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Forced smiles or posed portraits</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Looking directly at the camera</span></li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"eaba3d46-53f1-46be-88f3-83950ae99eed","type":"imageGrid","content":{"alt":"grok-image-67cab123-f52c-470e-9e71-1c72476b6834.jpg","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768466625920-quv8gq.jpg","width":null,"images":[{"alt":"ChatGPT Image Jan 15, 2026, 09_45_08 AM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768466728844-4byn5.png"},{"alt":"15d5d1ff-68e3-45dd-a12f-859a3eb45127.jpg","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768467022118-pcbb06.jpg"},{"alt":"ChatGPT Image Jan 15, 2026, 10_09_38 AM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768468208589-unm4g1.png"}],"aspectRatio":"auto","tightSpacing":false}},{"id":"79113df4-4da7-4905-ac65-9193cadae898","type":"text","content":{"text":"Team and Culture","variant":"heading2"}},{"id":"1ac99997-1b79-48c7-833f-a731ed4fdeee","type":"text","content":{"text":"When showing the Nobora team, the focus is on energy and culture, not hierarchy.<br>Team photos should feel like a crew, not staff portraits.","variant":"paragraph"}},{"id":"7527fc22-978c-496a-8538-7fcdda645405","type":"text","content":{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}},{"id":"b175ee94-eca4-4917-b833-1ae164b30f05","type":"text","content":{"text":"<ol><li>Casual clothing</li><li>Natural light</li><li>Group moments, not formal lineups</li><li>Behind-the-scenes energy</li></ol>","variant":"paragraph","tightSpacing":true}},{"id":"06ece8c2-0347-4fea-8443-194d770af4c9","type":"text","content":{"text":"Avoid<br>","variant":"heading3","tightSpacing":true}},{"id":"98b1b678-352b-4bc8-a0c1-a4c95a846f5d","type":"text","content":{"text":"<ul><li>Corporate headshots</li><li>Plain studio backdrops</li><li>Formal posture</li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"dfe411d0-cf2a-4616-812c-df61d9fddc54","type":"imageGrid","content":{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 12_20_03 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768476053541-kkv75l.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_13_36 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768476053542-nbafd.png"}],"aspectRatio":"auto"}},{"id":"33b42f54-d0e3-4657-beea-9d2e7fcc4a09","type":"text","content":{"text":"Motion and Momentum","variant":"heading2"}},{"id":"272ca7bb-3a95-4357-82fa-d398b0d39b9a","type":"text","content":{"text":"Movement is central to the Nobora story.<br>Money moves. People move. Life moves.<br><br>Photography should reflect forward motion and momentum.","variant":"paragraph","tightSpacing":true}},{"id":"95f66fff-bf2c-41f1-aa9a-fcd94f54edac","type":"text","content":{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}},{"id":"3ffe6e21-8f14-4ff7-ab55-204c9310131c","type":"text","content":{"text":"<ol><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Walking, running, stepping forward</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Motion blur in backgrounds</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Cropped frames that imply speed</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Transitional moments</span></li></ol>","variant":"paragraph","tightSpacing":true}},{"id":"dd06d387-ed53-4b96-b9ca-82b9cfaa4efe","type":"imageGrid","content":{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 12_40_36 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768477261980-wjl4r.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_33_05 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768477396197-5byti9.png"}],"aspectRatio":"auto"}},{"id":"a7c1fdbf-e297-4e12-9101-147455164608","type":"text","content":{"text":"Events and Campaigns","variant":"heading2"}},{"id":"83c53f71-7073-4235-af41-8c14a22c4f5e","type":"text","content":{"text":"Event photography captures community, movement, and shared wins.<br>These images should feel documentary-style. Real moments. Real reactions. Real energy.","variant":"paragraph","tightSpacing":true}},{"id":"746a4527-edef-468b-8d22-868dcaf691c3","type":"text","content":{"text":"Visual Direction","variant":"heading3","tightSpacing":true}},{"id":"b39c2b45-c4fb-4d63-bb3f-ae97d356b02f","type":"text","content":{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Candid interactions</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">People mid-conversation or action</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Genuine expressions</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Focus on participation, not branding</span></li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"08a7445f-8c68-4770-a6f9-a25baac197d5","type":"text","content":{"text":"Avoid","variant":"heading3","tightSpacing":true}},{"id":"9386b53b-dcfe-486d-b9e7-52ff9e3105a6","type":"text","content":{"text":"Over-branded backdrops<br>Staged group photos<br>Forced poses","variant":"paragraph"}},{"id":"71b6d5be-937d-4cd2-a16a-230ef6fa5614","type":"imageGrid","content":{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 01_00_37 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478470801-gshl9p.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_58_52 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478470802-948bwf.png"}],"aspectRatio":"auto"}},{"id":"9ffab42a-21db-416a-848d-f484afbedba4","type":"text","content":{"text":"Environment and Setting","variant":"heading2"}},{"id":"dea57a4d-112e-4a4f-bef6-207ccc067e92","type":"text","content":{"text":"Nobora lives in the real world.<br><br>Settings should feel urban, everyday, and current. Streets, cafés, transport, outdoor spaces. Places where money actually gets used.","variant":"paragraph"}},{"id":"3f930d08-283b-4e50-b345-090b87a11f8f","type":"text","content":{"text":"Visual Direction","variant":"heading3","tightSpacing":true}},{"id":"a3c43fe2-075c-4e23-b245-0af7cfc6b796","type":"text","content":{"text":"<ul><li>City streets</li><li>Cafés and public spaces</li><li>Transit environments</li><li>Natural, lived-in locations</li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"096accbe-c940-4d5f-962c-76135dad58d8","type":"text","content":{"text":"Avoid","variant":"heading3","tightSpacing":true}},{"id":"e2f5abb4-8eb5-406b-82e2-1cff49549c5e","type":"text","content":{"text":"Generic offices<br>Empty studio spaces<br>Artificial environments","variant":"paragraph"}},{"id":"40d74347-19ba-4a7d-9806-5a6de337ea76","type":"image","content":{"alt":"ChatGPT Image Jan 15, 2026, 12_48_47 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478091157-dc0yn.png"}},{"id":"14bb15b2-a315-42d3-a5f3-ec298998cb3e","type":"text","content":{"text":"Logo Usage in Photography","variant":"heading2"}},{"id":"79233172-9a2a-4563-b2d5-422da777f8c7","type":"text","content":{"text":"The logo should never overpower the image.<br><br>Photography leads. Branding supports.","variant":"paragraph"}},{"id":"08d643f2-d128-46bb-9db0-717de5a3329b","type":"text","content":{"text":"Visual Direction","variant":"heading3","tightSpacing":true}},{"id":"a007287e-73f4-4a7d-b2b3-6e0672009958","type":"text","content":{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Use the logo sparingly</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Keep it small and unobtrusive</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Place it where it doesn’t distract from the moment</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Let the image carry the emotion</span></li></ul>","variant":"paragraph","tightSpacing":true}},{"id":"a67c451b-1831-4018-a036-423fb8769cc8","type":"image","content":{"alt":"Frame 1067.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768480390670-yzh0wr.png"}}]},{"id":"03811259-8dce-4fd1-814a-2bbfd94a61f6","slug":"layouts","group":"Design","title":"Applications","blocks":[{"id":"d19986f8-cd52-4792-9bd9-9c6ad94d9c6f","type":"text","content":{"text":"","variant":"heading2","tightSpacing":true}}]},{"id":"e52697c7-8f19-4664-af11-a28dc49299a7","slug":"illustration","group":"Design","title":"Illustration","blocks":[{"id":"9ebc7701-a473-4347-bc5e-1b142dff8b00","data":{"text":"Be min","variant":"heading2"},"type":"text","content":{"text":"","variant":"heading2","tightSpacing":true}}]},{"id":"c447f4cb-c36f-4d79-be50-961324e097ec","slug":"icons","group":"Design","title":"","blocks":[{"id":"d9cbdbf0-8db6-473b-8096-8e14cae13bab","type":"text","content":{"text":"Icons","variant":"heading1"}},{"id":"997a8d2d-1015-4768-958f-3e4ba3c3b9ae","type":"text","content":{"text":"Our icon library and usage guidelines.","variant":"paragraph"}}]}]}',
        v_workspace_id
    ) RETURNING id INTO v_new_brand_id;

    RAISE NOTICE 'Created Brand ID: %', v_new_brand_id;

    -- 4. Insert Collections
    
    INSERT INTO collections (brand_id, name)
    VALUES (v_new_brand_id, 'Primary Logo')
    RETURNING id INTO v_col_0;
    

    INSERT INTO collections (brand_id, name)
    VALUES (v_new_brand_id, 'Secondary Logo')
    RETURNING id INTO v_col_1;
    

    INSERT INTO collections (brand_id, name)
    VALUES (v_new_brand_id, 'Typeface')
    RETURNING id INTO v_col_2;
    

    -- 5. Insert Pages & Blocks
    
    -- Page: Welcome
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'introduction', 'Welcome', 0)
    RETURNING id INTO v_page_0;

    -- Blocks for Page 0
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_0, 'text', '{"text":"Introduction","variant":"heading2","tightSpacing":false}', 0);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_0, 'text', '{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\"><ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Your complete resource for building consistent, powerful brand experiences across every touchpoint.</span></li><li>These guidelines ensure that everyone, from our internal teams to external partners, can confidently represent the Nebora brand. Whether you''re designing an app screen, writing a tweet, or creating a presentation, you''ll find everything you need here.</li></ul></p>\n","variant":"paragraph"}', 1);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_0, 'image', '{"alt":"Frame 88.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768202772795-z3ymn4.png","width":null,"fullWidth":true}', 2);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_0, 'text', '{"text":"Need Help?","variant":"heading3"}', 3);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_0, 'text', '{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Can''t find what you''re looking for? Contact the brand team:</p>\n<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">📧<a class=\"underline underline underline-offset-2 decoration-1 decoration-current/40 hover:decoration-current focus:decoration-current\" href=\"mailto:brand@nebora.com\">brand@nebora.com</a></p>","variant":"paragraph"}', 4);
    
    

    -- Page: Tone of voice
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'tone-of-voice', 'Tone of voice', 1)
    RETURNING id INTO v_page_1;

    -- Blocks for Page 1
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<p data-path-to-node=\"4\"><span style=\"background-color: rgba(0, 0, 0, 0); color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: -0.015em;\">The world of cryptocurrency is often noisy, volatile, and confusing. Nobora is the opposite.&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: -0.2px;\">We are the signal in the noise. We are the stable ground.</span></p>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#eff6ff"}', 0);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Our voice is designed to demystify DeFi (Decentralized Finance) for the everyday person. We do not use hype. We do not promise \"to the moon.\" We promise access, ease, and security. We speak with the confidence of a bank but the agility of a tech startup.","variant":"paragraph","tightSpacing":true}', 1);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'divider', '{}', 2);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"How Nebora Speaks","variant":"heading2","tightSpacing":true}', 3);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Nebora speaks as a <strong>knowledgeable friend</strong>—confident but never cocky, professional but never cold, expert but never condescending.</p>\n<p class=\"font-claude-response-body break-words whitespace-normal leading-[1.7]\">Think of us as that friend who really understands crypto and finances, but explains things in a way that makes sense over a beer, not in a boardroom.</p>","variant":"paragraph","tightSpacing":true}', 4);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"1. Bring the Energy.","variant":"heading3"}', 5);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<p data-path-to-node=\"4\">Money doesn''t have to be boring. We are the spark that gets things moving. Our language is high-voltage and enthusiastic. We don''t just \"process transactions.\" We make things happen. We use punchy sentences and active verbs to keep the momentum going.</p>","variant":"paragraph","tightSpacing":true}', 6);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<li><p data-path-to-node=\"7,0,1,0,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"7,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"Your funds have been successfully deposited into your account.\" (Boring)</font></p></li><li><p data-path-to-node=\"7,0,1,1,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"7,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Boom. Your money has landed.\" (Energetic)</font></p></li>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}', 7);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'image', '{"alt":"Frame 92.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768202804260-er76kt.png","fullWidth":false}', 8);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"2. Unlock Freedom","variant":"heading3"}', 9);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"We are here to break down walls. The old financial system is slow and full of \"no.\" Nobora is full of \"yes.\" We focus on what the user can <i data-path-to-node=\"9\" data-index-in-node=\"139\">do</i> right now. We frame every feature as a superpower that liberates their cash from the digital world into the real world.","variant":"paragraph"}', 10);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<ul><li><span data-path-to-node=\"10,0,1,0,0\" data-index-in-node=\"0\" style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\">Instead of:</span><span style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\"> \"You can withdraw your crypto to a local bank account.\" (Functional)</span></li><li><span data-path-to-node=\"10,0,1,1,0\" data-index-in-node=\"0\" style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\">Nobora says:</span><span style=\"font-family: inherit; background-color: rgba(0, 0, 0, 0); color: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: -0.015em;\"> \"Crypto to Cash. Spend it anywhere, anytime. You''re free.\" (Liberating)</span></li></ul>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}', 11);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'image', '{"images":[]}', 12);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"3. Keep It Real","variant":"heading3"}', 13);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"We don''t talk like a suit. We talk like friends. We are part of the internet culture. We use casual language, relevant slang (when it fits), and a conversational rhythm. We are not trying to impress you with big words. We are trying to vibe with you.","variant":"paragraph"}', 14);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<li><p data-path-to-node=\"13,0,1,0,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"13,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"We offer competitive interest rates on your stablecoin savings.\" (Corporate)</font></p></li><li><p data-path-to-node=\"13,0,1,1,0\"><font face=\"inherit\" style=\"\"><span data-path-to-node=\"13,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Let your money chill and earn. While you sleep, your balance grows.\" (Youthful)</font></p></li>","variant":"heading3","hasPadding":true,"tightSpacing":true,"backgroundColor":"#f9fafb"}', 15);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'image', '{}', 16);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"4. Be Bold and Direct","variant":"heading3"}', 17);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Confidence is attractive. We don''t hedge our bets or use timid language. We tell you exactly what to do and what you will get. We use short, imperative headlines that act as a call to adventure rather than just a call to action.","variant":"paragraph"}', 18);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<li><p data-path-to-node=\"16,0,1,0,0\"><font face=\"monospace\"><b style=\"\"><i style=\"\"><span data-path-to-node=\"16,0,1,0,0\" data-index-in-node=\"0\" style=\"\">Instead of:</span> \"Please sign up to start trading.\" (Polite)</i></b></font></p></li><li><p data-path-to-node=\"16,0,1,1,0\"><font face=\"monospace\"><b style=\"\"><i style=\"\"><span data-path-to-node=\"16,0,1,1,0\" data-index-in-node=\"0\" style=\"\">Nobora says:</span> \"Get in. Start winning.\" (Bold)</i></b></font></p></li>","variant":"paragraph"}', 19);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'image', '{}', 20);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"5. Celebrate the Wins","variant":"heading3"}', 21);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Every saved dollar and every successful swap is a win. We act as the user''s personal hype team. We use positive, affirming language to make financial management feel like a game that they are winning.<div><br><div><li><p data-path-to-node=\"19,0,1,0,0\"><b><i><font face=\"monospace\"><span data-path-to-node=\"19,0,1,0,0\" data-index-in-node=\"0\">Instead of:</span> \"Transaction history updated.\" (System status)</font></i></b></p></li><li><p data-path-to-node=\"19,0,1,1,0\"><b><i><font face=\"monospace\"><span data-path-to-node=\"19,0,1,1,0\" data-index-in-node=\"0\">Nobora says:</span> \"Another smart move. Check out your latest wins.\" (Celebratory)</font></i></b></p></li></div></div>","variant":"paragraph"}', 22);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'image', '{}', 23);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'divider', '{}', 24);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"When to adjust your tone","variant":"heading2","tightSpacing":true}', 25);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"While Nobora is always high-energy, we know when to turn the volume up and when to focus on clarity.","variant":"paragraph","tightSpacing":true}', 26);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"By Context","variant":"heading3","tightSpacing":false}', 27);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<b data-path-to-node=\"21,0,0\" data-index-in-node=\"0\">Social Media (Volume: 10/10):</b> This is our playground. We are the \"Main Character.\" We use memes, trend-jacking, and maximum hype. We celebrate user wins loudly. If the market is crashing, we are the friends cracking a joke to keep spirits high.","variant":"paragraph"}', 28);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,0,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span> Unfiltered, witty, and loud.</u></i></font>","variant":"paragraph","tightSpacing":true}', 29);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<b data-path-to-node=\"21,1,0\" data-index-in-node=\"0\">Product &amp; In-App (Volume: 7/10):</b> We keep the energy high, but functionality comes first. We want the user to feel fast and efficient. We use micro-copy that rewards action (\"Nice,\" \"Got it,\" \"Done\").","variant":"paragraph"}', 30);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,1,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span> Punchy, encouraging, and frictionless.</u></i></font>","variant":"paragraph","tightSpacing":true}', 31);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<b data-path-to-node=\"21,2,0\" data-index-in-node=\"0\">Customer Support (Volume: 4/10):</b> When things go wrong, the \"hype\" needs to take a backseat to \"help.\" We drop the slang if it confuses the issue. We are still not corporate robots, though. We are the \"smart friend who knows how to fix it.\" We are calm, capable, and on their side.","variant":"paragraph"}', 32);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<font face=\"monospace\"><i><u><span data-path-to-node=\"6,1,1,0,0\" data-index-in-node=\"0\"><b>Tone:</b></span>&nbsp;Real, empathetic, and solution-focused.</u></i></font>","variant":"paragraph","tightSpacing":true}', 33);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"By Audience","variant":"heading3"}', 34);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Audience: The Newbie (Just joined)","variant":"heading3","tightSpacing":true}', 35);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<b data-path-to-node=\"9,0,0\" data-index-in-node=\"0\">Mindset:</b> Excited but maybe a little intimidated by crypto.","variant":"paragraph"}', 36);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Our Tone:</b> The Welcoming Committee. We make them feel like they just joined the coolest club on earth. We emphasize ease and safety.","variant":"paragraph","tightSpacing":true}', 37);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<i><b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Voice:</b>&nbsp;\"You are in. Let''s show you around.\"</i>","variant":"paragraph","tightSpacing":true}', 38);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"By Audience","variant":"heading3"}', 39);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Audience:  The Grinder (Active Trader/Saver)","variant":"heading3","tightSpacing":true}', 40);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<b data-path-to-node=\"9,0,0\" data-index-in-node=\"0\">Mindset:</b> Knows the game. Wants speed and results.","variant":"paragraph"}', 41);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Our Tone:</b> The Hype Man. We validate their moves. We acknowledge their hustle.","variant":"paragraph","tightSpacing":true}', 42);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<i><b data-path-to-node=\"9,1,0\" data-index-in-node=\"0\">Voice:</b>&nbsp;\"Market is moving. Good thing you are too.\"</i>","variant":"paragraph","tightSpacing":true}', 43);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'divider', '{}', 44);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Ready-to-use Examples","variant":"heading2"}', 45);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Here is how the <b data-path-to-node=\"17\" data-index-in-node=\"16\">Nobora</b> voice translates into actual copy compared to a traditional bank.","variant":"paragraph"}', 46);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Headlines","variant":"heading3"}', 47);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Your Wallet. On Steroids.</span></li><li><p data-path-to-node=\"2,1,0\">Break Up With Your Bank.</p></li><li><p data-path-to-node=\"2,2,0\">Crypto made for humans. (Finally.)</p></li><li><p data-path-to-node=\"2,3,0\">Stop watching. Start earning.</p></li><li><p data-path-to-node=\"2,4,0\">Your money, moving at the speed of the internet.</p></li><li><p data-path-to-node=\"2,5,0\">The only wallet you actually want to use.</p></li>","variant":"paragraph"}', 48);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"General CTAs (Calls to Action)","variant":"heading3"}', 49);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<li><p data-path-to-node=\"4,0,0\"><span data-path-to-node=\"4,0,0\" data-index-in-node=\"0\">Send It</span></p></li><li><p data-path-to-node=\"4,1,0\"><span data-path-to-node=\"4,1,0\" data-index-in-node=\"0\">Let''s Go</span></p></li><li><p data-path-to-node=\"4,2,0\"><span data-path-to-node=\"4,2,0\" data-index-in-node=\"0\">Get the Alpha</span></p></li><li><p data-path-to-node=\"4,3,0\"><span data-path-to-node=\"4,3,0\" data-index-in-node=\"0\">Secure the Bag</span></p></li><li><p data-path-to-node=\"4,4,0\"><span data-path-to-node=\"4,4,0\" data-index-in-node=\"0\">Start Winning</span></p></li><li><p data-path-to-node=\"4,5,0\"><span data-path-to-node=\"4,5,0\" data-index-in-node=\"0\">Unlock Freedom</span></p></li><li><p data-path-to-node=\"4,6,0\"><span data-path-to-node=\"4,6,0\" data-index-in-node=\"0\">Claim Your Account</span></p></li>","variant":"paragraph"}', 50);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Onboarding &amp; Empty States","variant":"heading3"}', 51);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<li><span data-path-to-node=\"6,0,0\" data-index-in-node=\"0\" style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><b>No Transactions</b></span><b data-path-to-node=\"6,0,0\" data-index-in-node=\"0\" style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">:</b><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"> It''s quiet in here. Too quiet. Make a move.</span></li><li><p data-path-to-node=\"6,1,0\"><b data-path-to-node=\"6,1,0\" data-index-in-node=\"0\">Identity Verification:</b> Let''s make sure you are you. Quick selfie?</p></li><li><p data-path-to-node=\"6,2,0\"><b data-path-to-node=\"6,2,0\" data-index-in-node=\"0\">Account Setup:</b> First things first. Let''s get you set up.</p></li><li><p data-path-to-node=\"6,3,0\"><b data-path-to-node=\"6,3,0\" data-index-in-node=\"0\">Zero Balance:</b> You''re sitting on zero. Let''s fix that.</p></li><li><p data-path-to-node=\"6,4,0\"><b data-path-to-node=\"6,4,0\" data-index-in-node=\"0\">Connect Bank:</b> Link up. Cash in.</p></li>","variant":"paragraph","tightSpacing":true}', 52);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Feature Descriptions","variant":"heading3"}', 53);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"1. The Swap Feature","variant":"heading4","tightSpacing":true}', 54);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<li><p data-path-to-node=\"8,0,0\"><b data-path-to-node=\"8,0,0\" data-index-in-node=\"0\">The Swap:</b> Swap it like it''s hot. Instant trades. Zero stress.</p></li><li><p data-path-to-node=\"8,1,0\"><b data-path-to-node=\"8,1,0\" data-index-in-node=\"0\">Savings:</b> Lazy money is lost money. Put your cash to work while you sleep.</p></li><li><p data-path-to-node=\"8,2,0\"><b data-path-to-node=\"8,2,0\" data-index-in-node=\"0\">Security:</b> Locked down tight. Your keys, your crypto, your peace of mind.</p></li><li><p data-path-to-node=\"8,3,0\"><b data-path-to-node=\"8,3,0\" data-index-in-node=\"0\">Withdrawals:</b> Crypto to Cash. In seconds. Spend it on real life.</p></li><li><p data-path-to-node=\"8,4,0\"><b data-path-to-node=\"8,4,0\" data-index-in-node=\"0\">Market Trends:</b> Don''t guess. We''ve got the cheat codes right here.</p></li>","variant":"paragraph"}', 55);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"Social Media Captions","variant":"heading3","tightSpacing":false}', 56);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_1, 'text', '{"text":"<li><p data-path-to-node=\"10,0,0\"><b data-path-to-node=\"10,0,0\" data-index-in-node=\"0\">Market Dip:</b> Red charts? Discount shopping day. 🛒</p></li><li><p data-path-to-node=\"10,1,0\"><b data-path-to-node=\"10,1,0\" data-index-in-node=\"0\">New Feature:</b> You asked. We listened. Then we built it. Drop 2.0 is live. 🔥</p></li><li><p data-path-to-node=\"10,2,0\"><b data-path-to-node=\"10,2,0\" data-index-in-node=\"0\">Community Love:</b> Shoutout to everyone holding through the weekend. We see you. 👀</p></li><li><p data-path-to-node=\"10,3,0\"><b data-path-to-node=\"10,3,0\" data-index-in-node=\"0\">Motivation:</b> If you were waiting for a sign to start, this is it. 🚀</p></li><li><p data-path-to-node=\"10,4,0\"><b data-path-to-node=\"10,4,0\" data-index-in-node=\"0\">Lifestyle:</b> Coffee paid for by crypto yields. The best kind of morning. ☕️</p></li><li><p data-path-to-node=\"10,5,0\"><b data-path-to-node=\"10,5,0\" data-index-in-node=\"0\">Speed:</b> Faster than your bank. Smoother than your ex. Try Nobora.</p></li>","variant":"paragraph"}', 57);
    
    

    -- Page: Logos
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'logos', 'Logos', 2)
    RETURNING id INTO v_page_2;

    -- Blocks for Page 2
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"The badge of the New Era","variant":"heading2"}', 0);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<p data-start=\"192\" data-end=\"219\">This is the face of Nobora.</p>\n<p data-start=\"221\" data-end=\"465\">It represents movement, progress, and money that doesn’t stay stuck.&nbsp;</p>","variant":"heading3","tightSpacing":true}', 1);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"The logo is designed to feel modern, fast, and optimistic. It should always feel clear, confident, and easy to recognize, whether it’s on an app icon or a full website header.<br>","variant":"paragraph"}', 2);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'image', '{"alt":"Frame 94.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768205604627-gk94cj.png","width":null,"caption":"Nobora Logo","fullWidth":false}', 3);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Logotype","variant":"heading2"}', 4);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<p data-start=\"636\" data-end=\"674\">The word <b>“nobora”</b> is set in lowercase.</p>\n<p data-start=\"676\" data-end=\"900\">Lowercase keeps the brand approachable and modern. It feels open, friendly, and digital-first, not rigid or institutional. The type is clean and simple, so it stays readable at any size, from a phone screen to a large banner.</p><p data-start=\"676\" data-end=\"900\"><br></p><p data-start=\"676\" data-end=\"900\">The <b>Logotype and Icon</b> are designed to be used as a unit. We have optically adjusted the lettering for a specific rhythm, so please use the official logo files instead of typing the name manually. However, in body copy or live web text, type the name using the font.</p>","variant":"paragraph"}', 5);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Use the wordmark when:","variant":"heading3","tightSpacing":true}', 6);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<p data-start=\"902\" data-end=\"924\"><span style=\"background-color: transparent; font-family: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit;\"><i>Introducing the brand</i></span></p><ul data-start=\"925\" data-end=\"1027\"><li data-start=\"949\" data-end=\"982\"><p data-start=\"951\" data-end=\"982\"><i>Clarity matters more than speed</i></p></li><li data-start=\"983\" data-end=\"1027\"><p data-start=\"985\" data-end=\"1027\"><i>There’s enough space to show the full name</i></p></li></ul>","variant":"paragraph","tightSpacing":true}', 7);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'image', '{"alt":"Frame 100.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768212431196-sfp8yn.png"}', 8);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Logomark (Icon)","variant":"heading2"}', 9);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<p data-start=\"1054\" data-end=\"1157\">The icon is built from the letter <strong data-start=\"1088\" data-end=\"1093\">N</strong>, combined with a directional takeoff shape that forms an arrow.&nbsp;<span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">It communicates&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">forward movement,&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">growth, and t</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">ransition from local to global money.</span></p><p data-start=\"1159\" data-end=\"1175\"><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></p>\n<p data-start=\"1251\" data-end=\"1405\">The arrow cutting through the form gives the logo energy. It feels like motion, not a static badge. This makes the icon strong enough to stand on its own.&nbsp;</p>","variant":"paragraph"}', 10);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Use the icon when","variant":"heading3","tightSpacing":true}', 11);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<li data-start=\"1426\" data-end=\"1444\"><p data-start=\"1428\" data-end=\"1444\"><i>Space is limited</i></p>\n</li>\n<li data-start=\"1445\" data-end=\"1476\">\n<p data-start=\"1447\" data-end=\"1476\"><i>The brand is already familiar</i></p>\n</li>\n<li data-start=\"1477\" data-end=\"1507\">\n<p data-start=\"1479\" data-end=\"1507\"><i>Speed and recognition matter</i></p></li>","variant":"paragraph"}', 12);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'imageGrid', '{"images":[{"alt":"Frame 93.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206144464-k8d8wk.png"},{"alt":"Frame 95.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206144464-ylf7fr.png"}],"aspectRatio":"square"}', 13);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Logo Usage Guidelines","variant":"heading2"}', 14);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Use the Nobora logo clearly and consistently. When in doubt, keep it simple and&nbsp;<div>high-contrast.</div>","variant":"paragraph","tightSpacing":true}', 15);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'imageGrid', '{"images":[{"alt":"Frame 96.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511854-8r7x6d.png","caption":"Dark Background"},{"alt":"Frame 97.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511855-3qd8e.png","caption":"Blue Background"},{"alt":"Frame 99.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768206511855-w5xiha.png","caption":"Orange Background"}],"aspectRatio":"auto","tightSpacing":true}', 16);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Primary Logo Usage&nbsp;","variant":"heading3"}', 17);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">The </span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>Nobora blue</b></span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"> logos are the default and primary expression of the Nobora brand.</span></div><br><b>They represent:</b><br><ul><li>Trust</li><li>Stability</li><li>Credibility</li><li>“Signal in the noise”</li></ul><div><b><br></b></div><div><b>Rule:</b></div><div>When in doubt, use the <b>Nobora blue</b> logo.<br>Product UI,s website headers, formal communications, partnerships, and anything trust-critical must use the blue logo.<br></div>","variant":"paragraph"}', 18);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Secondary Logo Usage&nbsp;","variant":"heading3"}', 19);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"></span></div>The orange logo is <b>allowed</b>, but it is not a <b>replacement</b> for the primary logo.<br><br>Orange is expressive, energetic, and attention-grabbing. That makes it powerful but dangerous if overused.<br><br><b>When orange is appropriate</b><br><ul><li>Orange logo can be used in:</li><li>Campaigns and launches</li><li>Social media posts</li><li>Marketing moments</li><li>Celebratory states</li><li>Short-lived visuals</li><li>High-energy brand expressions</li></ul><br><b>Think movement, momentum, </b>and<b> wins, </b>not<b> infrastructure.</b><div><br></div>","variant":"paragraph"}', 20);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Minimum Size","variant":"heading2"}', 21);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"To ensure legibility across all digital devices, the full logo lockup must maintain a minimum width of&nbsp;<strong>126 pixels</strong>. Scaling below this size compromises readability and is not permitted.","variant":"paragraph"}', 22);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'image', '{"alt":"Frame 102.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768218614275-plq9f5.png","caption":"Minimum size lockup"}', 23);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Logo Positioning","variant":"heading2"}', 24);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<b data-path-to-node=\"6,0\" data-index-in-node=\"0\">The Default:</b> Place the logo in the <b data-path-to-node=\"6,0\" data-index-in-node=\"35\">Top Left</b>.\n<b data-path-to-node=\"6,0\" data-index-in-node=\"45\">The Backup:</b> If the design requires a different layout, refer to the visual guide below for approved positions.","variant":"paragraph"}', 25);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'image', '{"alt":"Frame 101.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768219607497-tny2a9.png","caption":"Logo positioning "}', 26);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Clear Space","variant":"heading2"}', 27);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"<p data-start=\"127\" data-end=\"220\">Always leave enough clear space around the Nobora logo so it remains legible and uncluttered.</p>\n<p data-start=\"222\" data-end=\"359\">The minimum clear space is defined by the height of the <strong data-start=\"278\" data-end=\"285\">“n”</strong> in the wordmark. This space should be kept free on all sides of the logo.</p>\n<p data-start=\"361\" data-end=\"423\">No text, images, UI elements, or edges should enter this area.</p>\n<p data-start=\"425\" data-end=\"521\">Clear space protects the logo’s visibility and ensures it always feels intentional, not crowded.</p>","variant":"paragraph"}', 28);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'image', '{"alt":"Frame 103.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768220814705-ykpsf7.png","caption":"Clear space"}', 29);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Logo Don''ts","variant":"heading2"}', 30);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"To maintain brand integrity, strictly use the provided master artwork files. Ensure the logo stands out clearly against its background and never alter, stretch, or distort the file.","variant":"paragraph"}', 31);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'imageGrid', '{"images":[{"alt":"Frame 104.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978735-vahmb.png","caption":"","description":"Don''t warp or distort our logo in any way "},{"alt":"Frame 105.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-p2zu2.png","description":"Don''t rotate any of our logo"},{"alt":"Frame 106.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-h64sec.png","caption":"","description":"Don''t use other typefaces as a replacement for our logo"},{"alt":"Frame 107.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-syy83y.png","description":"Don''t change the logo colors"},{"alt":"Frame 108.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-j0nl59.png","description":"Don''t add gradients to our logo"},{"alt":"Frame 109.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-fv3r2.png","description":"Don''t crop the logo"},{"alt":"Frame 110.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-o99r4c.png","description":"Don''t add any effects to the logo"},{"alt":"Frame 111.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768222978736-ufyns.png","description":"Don''t add any visual elements to our logo"}],"aspectRatio":"landscape"}', 32);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"App Icon","variant":"heading2"}', 33);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'text', '{"text":"Just the Mark. The Blue Arrow centered on Deep Navy. It stands out on any home screen. Tap it to unlock freedom.","variant":"paragraph"}', 34);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_2, 'imageGrid', '{"alt":"Frame 102j.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768228690281-hlwb9c.png","images":[{"alt":"Frame 113.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768229054509-6b9ze5.png"},{"alt":"Frame 1029.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768229202483-ixvj1.png"}],"aspectRatio":"square"}', 35);
    
    

    -- Page: Colors
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'colors', 'Colors', 3)
    RETURNING id INTO v_page_3;

    -- Blocks for Page 3
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Color is a core part of the Nobora identity. It sets the mood, builds recognition, and helps the brand feel confident and modern across every touchpoint.","variant":"heading3","tightSpacing":true}', 0);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"The primary colors define the brand’s foundation and should be used most often. Secondary and accent colors support the system by adding flexibility, hierarchy, and emphasis where needed.&nbsp;<div><br></div><div>&nbsp;Used consistently, the color palette ensures Nobora feels clear, energetic, and recognizable across product, marketing, and social media.</div>","variant":"paragraph"}', 1);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Primary Colors","variant":"heading2"}', 2);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"The primary colors form the foundation of the Nobora brand. They appear most often across product, marketing, and digital experiences.&nbsp;<div><br></div><div><b>Midnight Navy&nbsp;</b></div><div>This is the anchor color of the brand. It brings depth, stability, and trust. Use it for core surfaces, dark backgrounds, headers, and product environments where clarity and focus are needed.&nbsp;</div><div><br></div><div><b>Royal Blue</b></div><div>This is the main brand expression color. It feels modern, confident, and energetic. Use it for key sections, highlights, interactive elements, and brand-forward moments.</div><div><br></div><div>Primary colors should dominate most layouts and always feel intentional and balanced.</div>","variant":"paragraph"}', 3);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'image', '{"alt":"MacBook Pro 14_ - 7.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768309427199-u7ea4.png","width":null,"fullWidth":true}', 4);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Secondary Colors","variant":"heading2"}', 5);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Secondary colors support the primary palette by adding contrast, emphasis, and flexibility.","variant":"paragraph","tightSpacing":true}', 6);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"<b>Signal Orange</b><div>This is the accent color. It introduces energy and urgency and should be used sparingly. Use it for calls to action, notifications, highlights, and moments that need attention.&nbsp;</div><div><br></div><div><b>Soft Ivory</b></div><div>This is a neutral support color. It provides breathing space and balance, helping layouts feel clean and readable. Use it for backgrounds, content areas, and to soften bold compositions.&nbsp;</div><div><br></div><div>Secondary colors should never overpower the primary colors. They exist to support, not lead.</div>","variant":"paragraph"}', 7);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Accent Colors","variant":"heading2"}', 8);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Accent colors are used to add energy, personality, and emphasis across the Nobora brand. They bring moments to life without overpowering the core palette.\n\nAccent colors should be used sparingly and intentionally.&nbsp;<div><br></div><div>They are not meant to replace the primary colors, but to support them by drawing attention to key actions, highlights, or expressive moments.&nbsp;</div><div><br></div><div><b>Use accent colors for</b></div><div>1. Callouts and highlights</div><div>2. Illustrations and graphic elements</div><div>3. Badges, states, and promotional moments</div><div>4. Social media and campaign visuals</div>","variant":"paragraph","tightSpacing":true}', 9);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'image', '{"alt":"Frame 1037.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768309449656-v97spj.png","width":null,"fullWidth":true}', 10);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Accent Color Groups","variant":"heading3"}', 11);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Accent colors are grouped by hue to keep the system simple and flexible. Each group includes a stronger tone and a softer supporting tone.&nbsp;<div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b><br></b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>1. Accent Greens</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for growth, success states, highlights, and energetic moments.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>2. Accent Pinks</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for expressive, playful, or human-focused moments.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>3. Accent Yellows</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for attention, optimism, and emphasis.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>4. Accent Teals</b></span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">&nbsp;</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for calm, balance, and supportive accents.</span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\"><br></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\"><b>5. Accent Neutrals</b></span></div><div><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Used for warmth, softness, and subtle contrast. These support layouts without drawing attention.</span></div>","variant":"paragraph"}', 12);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Avoid using multiple accent colors in a single layout unless there is a clear reason. Too many accents reduce clarity and weaken impact.&nbsp;<div><br></div><div><i style=\"\">When in doubt, lead with the primary colors and let accent colors do the talking in small, focused moments.</i></div>","variant":"heading3"}', 13);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'divider', '{}', 14);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Tints","variant":"heading2"}', 15);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Tints are lighter versions of a base color, created by mixing the color with white.\n\nThey are primarily used for backgrounds, surfaces, and soft UI states. Tints help create breathing space, improve readability, and keep layouts feeling light and open.\n\nUse tints to support content, not to draw attention.","variant":"paragraph"}', 16);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'image', '{"alt":"Frame 1049.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768310709978-71eydc.png","width":null,"fullWidth":true}', 17);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Shades","variant":"heading2"}', 18);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Shades are darker versions of a base color, created by mixing the color with black.\n\nThey are used for emphasis, depth, and contrast. Shades work well for dark backgrounds, overlays, and strong interactive or focus states.\n\nUse shades to establish hierarchy and guide attention.","variant":"paragraph"}', 19);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'image', '{"alt":"Frame 1047.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768310735305-sfb4nj.png","width":null,"fullWidth":true}', 20);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Contrast","variant":"heading2"}', 21);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'text', '{"text":"Good contrast ensures text is clear, readable, and accessible across all applications. Text color should always be chosen based on the background tone.<div><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Use white text on darker color values and black text on lighter color values.&nbsp;&nbsp;</span><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">The switch happens at the midpoint of the color scale.</span></div><div><div><br>Avoid placing text on colors where readability is unclear. When in doubt, choose the option with stronger contrast. Contrast should support clarity first and style second.</div></div>","variant":"paragraph"}', 22);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_3, 'image', '{"alt":"Frame 1050.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768312781639-dvk64d.png","width":null,"fullWidth":true}', 23);
    
    

    -- Page: Typography
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'typography', 'Typography', 4)
    RETURNING id INTO v_page_4;

    -- Blocks for Page 4
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Typography is a core part of the Nobora identity. It shapes how the brand speaks across product, marketing, and social media.&nbsp;<br>","variant":"heading3","hasPadding":true,"backgroundColor":"#f9fafb"}', 0);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"The type system is designed to be clear, modern, and flexible while remaining consistent everywhere it appears.","variant":"paragraph"}', 1);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Zalando Sans is the primary typeface for Nobora.<br><br>It is used across product, marketing, and social media for body text, paragraphs, UI copy, and headings. Its clean structure and strong readability make it suitable for both functional interfaces and expressive brand moments.<br>","variant":"paragraph"}', 2);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'image', '{"alt":"MacBook Pro 14_ - 2.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768329228096-zm7h9e.png"}', 3);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Emphasis Variant","variant":"heading2"}', 4);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Zalando Sans Semi Expanded is the emphasis variant.","variant":"paragraph"}', 5);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"<ol><li></li><span style=\"font-weight: normal;\">Zalando Sans Semi Expanded is the emphasis variant.<br><br>It is used to add presence and visual strength without changing the type family. This variant creates emphasis through width rather than weight alone.</span><br><br>Zalando Sans Semi Expanded is used for:<br>hero headlines,<br>titles,<br>brand statements,<br>social media headlines,<br>and key marketing moments.<br><li></li></ol>","variant":"heading4","tightSpacing":true}', 6);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"This variant adds presence and confidence to key messages. It is also the variation used in the Nobora logotype, making it suitable for top-level brand moments.","variant":"paragraph"}', 7);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'image', '{"alt":"MacBook Pro 14_ - 2.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768329681182-4xzryo.png"}', 8);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Web Usage","variant":"heading2"}', 9);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"<div><font face=\"monospace\">css</font></div><div><font face=\"monospace\"><br></font></div><font face=\"monospace\">/* Body, paragraphs, UI */<br>font-family: \"Zalando Sans\", sans-serif;<br><br>/* Headings and titles */<br>font-family: \"Zalando Sans Semi Expanded\", sans-serif;</font><br>","variant":"paragraph","hasPadding":true,"backgroundColor":"#f3f4f6"}', 10);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Other Width Variations","variant":"heading2"}', 11);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Zalando Sans includes <b>Condensed, Semi Condensed, and Expanded</b> width variations.<div><br></div><div>These variations are not part of the core typography system and should not be used by default.</div>","variant":"paragraph","tightSpacing":true}', 12);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"They may only be used in special cases such as","variant":"heading3"}', 13);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"<b><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">1. Campaign visuals</span><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">2. Experimental layouts</span><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">3. Space-constrained designs</span></b>","variant":"paragraph"}', 14);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"They should never replace the primary or Semi Expanded styles in core brand or product interfaces.","variant":"paragraph"}', 15);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'divider', '{}', 16);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Typography hierarchy","variant":"heading2"}', 17);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"The Nobora type system uses a clear hierarchy to ensure readability and consistency across product, marketing, and social layouts.","variant":"paragraph"}', 18);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Headings","variant":"heading3"}', 19);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Headings can use either Zalando Sans or Zalando Sans Semi Expanded.<br><br>Zalando Sans is used for headings in product interfaces, dense layouts, and information-driven content where clarity is the priority.<br><br>Zalando Sans Semi Expanded is used for headings where stronger emphasis or expression is needed, especially in marketing, landing pages, and social media.<br><br>Both styles are correct. The choice depends on tone and context.","variant":"paragraph"}', 20);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'imageGrid', '{"images":[{"alt":"Frame 1060.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768339993088-ndgoa3.png"},{"alt":"Frame 1059.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768340006182-nui8ly.png"}],"aspectRatio":"portrait"}', 21);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Body text","variant":"heading3"}', 22);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Body text uses Zalando Sans in its regular width.<br><br>It is used for paragraphs, descriptions, long-form content, and captions. Body text should always prioritize readability and should not use condensed or expanded width variants.","variant":"paragraph"}', 23);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'image', '{"alt":"Frame 1061.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768339823117-po3fdm.png"}', 24);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"UI Text","variant":"heading3"}', 25);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"UI text uses Zalando Sans in Regular or Medium weights.<br><br><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">It is used for buttons, labels, navigation items, form fields, and system messages. UI text should remain neutral and supportive and should never compete with headings or emphasis text.</span>","variant":"paragraph","hasPadding":false,"backgroundColor":"transparent"}', 26);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'image', '{"alt":"Frame 1062.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768340579072-p8cns.png","width":1096,"fullWidth":false}', 27);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Captions and metadata","variant":"heading3"}', 28);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Captions and metadata use Zalando Sans.<br><br>They are used for helper text, timestamps, secondary information, and supporting labels. These should feel subtle and clear.","variant":"paragraph"}', 29);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Typography in social media","variant":"heading3"}', 30);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"Social media is fast, expressive, and mobile-first.<br><br>Headlines can use Zalando Sans Semi Expanded for strong, attention-grabbing statements or Zalando Sans for calmer, informative messages. Body text and captions always use Zalando Sans to maintain readability on small screens.<br><br>Condensed and expanded variants should be avoided on social media.","variant":"paragraph"}', 31);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'text', '{"text":"<span style=\"font-weight: normal;\"><i>Zalando Sans is used for all body text, UI text, captions, and general headings.<br>Zalando Sans Semi Expanded is used for emphasis, titles, hero headlines, and brand-forward moments.</i></span>","variant":"heading3","hasPadding":true,"backgroundColor":"#f9fafb"}', 32);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_4, 'imageGrid', '{"images":[{"alt":"Frame 1063.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768399665515-1g5xrq.png"},{"alt":"Frame 1064.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768399665517-wc7awg.png"}],"aspectRatio":"auto"}', 33);
    
    

    -- Page: Photography
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'photography', 'Photography', 5)
    RETURNING id INTO v_page_5;

    -- Blocks for Page 5
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"General Principles","variant":"heading2","tightSpacing":true}', 0);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"The energy in Nobora photography should showcase the following attributes:<br><br><b>1. Energetic<br>2. Youthful<br>3. Liberating<br>4. Confident<br>5. Human<br>6. In motion</b><br><br>Images should feel alive and unapologetic. They should reflect progress, freedom, and real-world wins. If a photo feels static, polite, or overly polished, it’s not Nobora.","variant":"paragraph","hasPadding":false,"tightSpacing":true,"backgroundColor":"transparent"}', 1);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'divider', '{}', 2);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"People and lifestyle","variant":"heading2"}', 3);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Nobora photography focuses on real people in real moments.<br>Not posed. Not staged. Not corporate.<br><br>Think movement, action, and everyday wins enabled by money.<br>","variant":"paragraph"}', 4);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}', 5);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"1. People using their phones mid-action<br>2. Friends moving through the city<br>3. Hands, gestures, motion<br>4. Faces optional, emotion essential","variant":"paragraph"}', 6);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Avoid","variant":"heading3","tightSpacing":true}', 7);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Suits, offices, boardrooms</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Forced smiles or posed portraits</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Looking directly at the camera</span></li></ul>","variant":"paragraph","tightSpacing":true}', 8);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'imageGrid', '{"alt":"grok-image-67cab123-f52c-470e-9e71-1c72476b6834.jpg","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768466625920-quv8gq.jpg","width":null,"images":[{"alt":"ChatGPT Image Jan 15, 2026, 09_45_08 AM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768466728844-4byn5.png"},{"alt":"15d5d1ff-68e3-45dd-a12f-859a3eb45127.jpg","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768467022118-pcbb06.jpg"},{"alt":"ChatGPT Image Jan 15, 2026, 10_09_38 AM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768468208589-unm4g1.png"}],"aspectRatio":"auto","tightSpacing":false}', 9);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Team and Culture","variant":"heading2"}', 10);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"When showing the Nobora team, the focus is on energy and culture, not hierarchy.<br>Team photos should feel like a crew, not staff portraits.","variant":"paragraph"}', 11);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}', 12);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"<ol><li>Casual clothing</li><li>Natural light</li><li>Group moments, not formal lineups</li><li>Behind-the-scenes energy</li></ol>","variant":"paragraph","tightSpacing":true}', 13);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Avoid<br>","variant":"heading3","tightSpacing":true}', 14);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"<ul><li>Corporate headshots</li><li>Plain studio backdrops</li><li>Formal posture</li></ul>","variant":"paragraph","tightSpacing":true}', 15);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'imageGrid', '{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 12_20_03 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768476053541-kkv75l.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_13_36 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768476053542-nbafd.png"}],"aspectRatio":"auto"}', 16);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Motion and Momentum","variant":"heading2"}', 17);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Movement is central to the Nobora story.<br>Money moves. People move. Life moves.<br><br>Photography should reflect forward motion and momentum.","variant":"paragraph","tightSpacing":true}', 18);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Visual direction<br>","variant":"heading3","tightSpacing":true}', 19);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"<ol><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Walking, running, stepping forward</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Motion blur in backgrounds</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Cropped frames that imply speed</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Transitional moments</span></li></ol>","variant":"paragraph","tightSpacing":true}', 20);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'imageGrid', '{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 12_40_36 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768477261980-wjl4r.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_33_05 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768477396197-5byti9.png"}],"aspectRatio":"auto"}', 21);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Events and Campaigns","variant":"heading2"}', 22);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Event photography captures community, movement, and shared wins.<br>These images should feel documentary-style. Real moments. Real reactions. Real energy.","variant":"paragraph","tightSpacing":true}', 23);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Visual Direction","variant":"heading3","tightSpacing":true}', 24);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Candid interactions</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">People mid-conversation or action</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Genuine expressions</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; font-weight: inherit; letter-spacing: 0px;\">Focus on participation, not branding</span></li></ul>","variant":"paragraph","tightSpacing":true}', 25);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Avoid","variant":"heading3","tightSpacing":true}', 26);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Over-branded backdrops<br>Staged group photos<br>Forced poses","variant":"paragraph"}', 27);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'imageGrid', '{"images":[{"alt":"ChatGPT Image Jan 15, 2026, 01_00_37 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478470801-gshl9p.png"},{"alt":"ChatGPT Image Jan 15, 2026, 12_58_52 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478470802-948bwf.png"}],"aspectRatio":"auto"}', 28);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Environment and Setting","variant":"heading2"}', 29);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Nobora lives in the real world.<br><br>Settings should feel urban, everyday, and current. Streets, cafés, transport, outdoor spaces. Places where money actually gets used.","variant":"paragraph"}', 30);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Visual Direction","variant":"heading3","tightSpacing":true}', 31);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"<ul><li>City streets</li><li>Cafés and public spaces</li><li>Transit environments</li><li>Natural, lived-in locations</li></ul>","variant":"paragraph","tightSpacing":true}', 32);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Avoid","variant":"heading3","tightSpacing":true}', 33);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Generic offices<br>Empty studio spaces<br>Artificial environments","variant":"paragraph"}', 34);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'image', '{"alt":"ChatGPT Image Jan 15, 2026, 12_48_47 PM.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768478091157-dc0yn.png"}', 35);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Logo Usage in Photography","variant":"heading2"}', 36);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"The logo should never overpower the image.<br><br>Photography leads. Branding supports.","variant":"paragraph"}', 37);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"Visual Direction","variant":"heading3","tightSpacing":true}', 38);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'text', '{"text":"<ul><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Use the logo sparingly</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Keep it small and unobtrusive</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Place it where it doesn’t distract from the moment</span></li><li><span style=\"background-color: transparent; color: inherit; font-family: inherit; font-size: inherit; font-style: inherit; font-variant-ligatures: inherit; font-variant-caps: inherit; letter-spacing: 0px;\">Let the image carry the emotion</span></li></ul>","variant":"paragraph","tightSpacing":true}', 39);
    

    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_5, 'image', '{"alt":"Frame 1067.png","src":"https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768480390670-yzh0wr.png"}', 40);
    
    

    -- Page: Applications
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'layouts', 'Applications', 6)
    RETURNING id INTO v_page_6;

    -- Blocks for Page 6
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_6, 'text', '{"text":"","variant":"heading2","tightSpacing":true}', 0);
    
    

    -- Page: Illustration
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'illustration', 'Illustration', 7)
    RETURNING id INTO v_page_7;

    -- Blocks for Page 7
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_7, 'text', '{"text":"","variant":"heading2","tightSpacing":true}', 0);
    
    

    -- Page: Untitled Section
    INSERT INTO pages (brand_id, slug, title, "order")
    VALUES (v_new_brand_id, 'untitled-1769131162815', 'Untitled Section', 8)
    RETURNING id INTO v_page_8;

    -- Blocks for Page 8
    
    INSERT INTO blocks (page_id, type, data, "order")
    VALUES (v_page_8, 'text', '{"text":"","variant":"paragraph"}', 0);
    
    

    -- 6. Insert Assets
    
    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'PNG',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logotype',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logomark',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logo',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-black.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553918909-2g8xpfc.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553918909-2g8xpfc.png',
        'image/png',
        46631,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-white.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553918909-aobw8j.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553918909-aobw8j.png',
        'image/png',
        37296,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-black.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553919356-51i329.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553919356-51i329.png',
        'image/png',
        38714,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-white.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553919356-rd7cl.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553919356-rd7cl.png',
        'image/png',
        41968,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-royal-blue.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553919356-p4uqm.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553919356-p4uqm.png',
        'image/png',
        46598,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-royal-blue-white-text.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553920232-wzc0s.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553920232-wzc0s.png',
        'image/png',
        32047,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-white.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553920233-p2d79q.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553920233-p2d79q.png',
        'image/png',
        29992,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-black.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553920232-agkhjl.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553920232-agkhjl.png',
        'image/png',
        29501,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-royal-blue-black-text.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553920232-fnrxk.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768553920232-fnrxk.png',
        'image/png',
        38352,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-black.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353806-c1gyuh.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353806-c1gyuh.jpg',
        'image/jpeg',
        308482,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'JPG',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logotype',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logomark',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logo',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-midnight-navy.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353343-r6oue.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353343-r6oue.jpg',
        'image/jpeg',
        380727,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-white(royal-blue).jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353343-2i1e6l.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353343-2i1e6l.jpg',
        'image/jpeg',
        380699,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-white.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353343-g3au3.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353343-g3au3.jpg',
        'image/jpeg',
        329724,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-white.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353810-b3lwr8.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353810-b3lwr8.jpg',
        'image/jpeg',
        308472,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-white(royal-blue).jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353810-71w38d.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353810-71w38d.jpg',
        'image/jpeg',
        380496,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-royal-blue.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353343-rdb6dh.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353343-rdb6dh.jpg',
        'image/jpeg',
        423243,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-black.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355023-e50fyb.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355023-e50fyb.jpg',
        'image/jpeg',
        348022,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-white.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355024-caucs.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355024-caucs.jpg',
        'image/jpeg',
        348167,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-black.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353342-0v4r4p.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353342-0v4r4p.jpg',
        'image/jpeg',
        329871,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-midnight-navy.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353807-1ts0hm.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353807-1ts0hm.jpg',
        'image/jpeg',
        348410,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-midnight-navy.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355024-rtbnbd.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355024-rtbnbd.jpg',
        'image/jpeg',
        417500,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-white(royal-blue).jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355024-st9dj.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355024-st9dj.jpg',
        'image/jpeg',
        419252,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-royal-blue.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353808-qpptmg.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554353808-qpptmg.jpg',
        'image/jpeg',
        380438,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-royal-blue.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355024-4wwf5.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554355024-4wwf5.jpg',
        'image/jpeg',
        462386,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'SVG',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logotype',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logomark',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logo',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-white.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554400662-rob36d.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554400662-rob36d.svg',
        'image/svg+xml',
        7823,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-black.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554400662-1pkvin.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554400662-1pkvin.svg',
        'image/svg+xml',
        7839,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-black.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401109-4kpyi.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401109-4kpyi.svg',
        'image/svg+xml',
        912,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-royal-blue.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401110-mioy3.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401110-mioy3.svg',
        'image/svg+xml',
        916,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-white.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401110-b87hzc.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401110-b87hzc.svg',
        'image/svg+xml',
        912,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-royal-blue-black-text.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401645-3whldg.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401645-3whldg.svg',
        'image/svg+xml',
        8665,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-black.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401644-9paibd.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401644-9paibd.svg',
        'image/svg+xml',
        8645,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-royal-blue-white-text.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401645-9tlxcb.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401645-9tlxcb.svg',
        'image/svg+xml',
        8649,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-white.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401645-ie68xl.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554401645-ie68xl.svg',
        'image/svg+xml',
        8645,
        'image',
        '[]',
        v_col_0
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'JPG',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logotype',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logomark',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logo',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-soft-ivory.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554420147-uunjkd.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554420147-uunjkd.jpg',
        'image/jpeg',
        412926,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-signal-orange.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554420146-dey8a5.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554420146-dey8a5.jpg',
        'image/jpeg',
        417984,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-signal-orange.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554420552-hnp17l.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554420552-hnp17l.jpg',
        'image/jpeg',
        376631,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-soft-ivory.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554420552-61stu8.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554420552-61stu8.jpg',
        'image/jpeg',
        373161,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-soft-ivory.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554421016-354af.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554421016-354af.jpg',
        'image/jpeg',
        401347,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-signal-orange.jpg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554421015-79rrz2a.jpg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554421015-79rrz2a.jpg',
        'image/jpeg',
        456291,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'PNG',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logotype',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logomark',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logo',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'static',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-signal-orange.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554430377-d3klfh.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554430377-d3klfh.png',
        'image/png',
        42780,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'SVG',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logo',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-signal-orange-black-text.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554439942-hx40w.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554439942-hx40w.png',
        'image/png',
        31167,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-signal-orange.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554430804-s1dilw.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554430804-s1dilw.png',
        'image/png',
        46111,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logotype',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logotype-signal-orange.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554439071-dq4j2e.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554439071-dq4j2e.svg',
        'image/svg+xml',
        7834,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-logo-signal-orange-black-text.png',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554431229-lahe4k.png',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554431229-lahe4k.png',
        'image/png',
        31167,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Logomark',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'nobora-mark-signal-orange.svg',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554439511-87vwt.svg',
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768554439511-87vwt.svg',
        'image/svg+xml',
        916,
        'image',
        '[]',
        v_col_1
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Zalando_Sans_SemiExpanded',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'static',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Zalando_Sans_Expanded',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'OFL.txt',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555810949-1wiz7i.txt',
        NULL,
        'text/plain',
        4518,
        'document',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'README.txt',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555810950-roxebm.txt',
        NULL,
        'text/plain',
        3398,
        'document',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-Italic-VariableFont_wght.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555810950-fm746r.ttf',
        NULL,
        '',
        129960,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'static',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-VariableFont_wght.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555810950-t01fkq.ttf',
        NULL,
        '',
        126352,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-BoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811394-2kypqi.ttf',
        NULL,
        '',
        67392,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-LightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811395-bth4rm.ttf',
        NULL,
        '',
        67628,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Zalando_Sans',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-ExtraBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811394-rq71go.ttf',
        NULL,
        '',
        65528,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-MediumItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811396-s82ceb.ttf',
        NULL,
        '',
        67688,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-Italic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811395-7ycmlg.ttf',
        NULL,
        '',
        67488,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-Bold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811393-lrxpb.ttf',
        NULL,
        '',
        65440,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-BlackItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811393-b2de0r.ttf',
        NULL,
        '',
        67440,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-ExtraLightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811395-gbci6a.ttf',
        NULL,
        '',
        66680,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-SemiBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811397-epuc7e.ttf',
        NULL,
        '',
        67584,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'OFL.txt',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555812650-77sivc.txt',
        NULL,
        'text/plain',
        4518,
        'document',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-ExtraLight.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811395-pw15b1.ttf',
        NULL,
        '',
        65636,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-Light.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811395-lbp9o4.ttf',
        NULL,
        '',
        65760,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-Regular.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811396-2g2u7d.ttf',
        NULL,
        '',
        65760,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-SemiBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811397-g8jws.ttf',
        NULL,
        '',
        65520,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-Medium.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811396-py2cnf.ttf',
        NULL,
        '',
        65708,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-ExtraBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811394-g72itn.ttf',
        NULL,
        '',
        67528,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansSemiExpanded-Black.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555811393-8zymxm.ttf',
        NULL,
        '',
        65448,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'README.txt',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555812651-e2srrs.txt',
        NULL,
        'text/plain',
        3234,
        'document',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-Italic-VariableFont_wght.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555812652-h5kkoe.ttf',
        NULL,
        '',
        126268,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-Black.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813731-33hqko.ttf',
        NULL,
        '',
        65428,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'OFL.txt',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555814176-a0vmze.txt',
        NULL,
        'text/plain',
        4518,
        'document',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-SemiBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813736-m7wtce.ttf',
        NULL,
        '',
        66712,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-ExtraBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813734-df1g5s.ttf',
        NULL,
        '',
        65476,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-Medium.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813735-znanol.ttf',
        NULL,
        '',
        65676,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-Regular.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815475-8k2yvp.ttf',
        NULL,
        '',
        64968,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-ExtraLight.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815477-whl91.ttf',
        NULL,
        '',
        64388,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-ExtraLight.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815481-yq1ib8.ttf',
        NULL,
        '',
        64916,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-BoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815473-3yl8z.ttf',
        NULL,
        '',
        67152,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-BlackItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815476-5na8kf.ttf',
        NULL,
        '',
        67136,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-ExtraLightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815479-rbulfx.ttf',
        NULL,
        '',
        66472,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-SemiBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815483-v1kva8.ttf',
        NULL,
        '',
        65568,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-BoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815481-w8uvd9.ttf',
        NULL,
        '',
        68324,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-MediumItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815478-ifhzgg.ttf',
        NULL,
        '',
        66040,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-Black.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815478-rwa2hu.ttf',
        NULL,
        '',
        65328,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-VariableFont_wght.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555812652-c1of8i.ttf',
        NULL,
        '',
        124696,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-MediumItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813735-8mhqbq.ttf',
        NULL,
        '',
        66632,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-LightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813735-brsul.ttf',
        NULL,
        '',
        66672,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-Bold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813731-uquxub.ttf',
        NULL,
        '',
        65648,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-Light.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813735-122hv.ttf',
        NULL,
        '',
        65744,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-ExtraLight.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813734-43xjak.ttf',
        NULL,
        '',
        65456,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-Light.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815474-tdky6.ttf',
        NULL,
        '',
        65076,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-Medium.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815477-npscfb.ttf',
        NULL,
        '',
        64964,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-SemiBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815475-k4a28ba.ttf',
        NULL,
        '',
        65316,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-MediumItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815475-gs59qd.ttf',
        NULL,
        '',
        66892,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-MediumItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815482-obvgcn.ttf',
        NULL,
        '',
        67248,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-Bold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815483-2ped5k.ttf',
        NULL,
        '',
        65304,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-Bold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815481-jk43vr.ttf',
        NULL,
        '',
        66296,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-ExtraLightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815484-jn68ye.ttf',
        NULL,
        '',
        66660,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-MediumItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815485-1skei6.ttf',
        NULL,
        '',
        67564,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-BoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813731-u53dd.ttf',
        NULL,
        '',
        66548,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-SemiBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813736-k5jcj.ttf',
        NULL,
        '',
        65680,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-Italic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813734-3ecp17.ttf',
        NULL,
        '',
        66572,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-BlackItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813731-aeanhi.ttf',
        NULL,
        '',
        66356,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-Regular.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813736-r21jyl.ttf',
        NULL,
        '',
        65672,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-ExtraLightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813734-ws3r1j.ttf',
        NULL,
        '',
        66472,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSansExpanded-ExtraBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555813734-q58nha.ttf',
        NULL,
        '',
        66516,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'README.txt',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555814176-ssq0x.txt',
        NULL,
        'text/plain',
        6729,
        'document',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-ExtraLight.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815474-m4cizj.ttf',
        NULL,
        '',
        64596,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-Medium.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815475-rkhx7l.ttf',
        NULL,
        '',
        65072,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-Regular.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815478-kke2s.ttf',
        NULL,
        '',
        64908,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-Black.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815473-q354b5.ttf',
        NULL,
        '',
        65224,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-Italic-VariableFont_wdth,wght.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555814176-iq7ioq.ttf',
        NULL,
        '',
        254704,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-Light.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815477-e4o2ej.ttf',
        NULL,
        '',
        64992,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-VariableFont_wdth,wght.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555814176-fpcf7.ttf',
        NULL,
        '',
        246064,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-Italic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815474-1g279j.ttf',
        NULL,
        '',
        66552,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-Bold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815473-snegw.ttf',
        NULL,
        '',
        65240,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-ExtraBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815474-s4ing9.ttf',
        NULL,
        '',
        65332,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-BlackItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815473-n6z6b.ttf',
        NULL,
        '',
        67220,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'Zalando Sans Family',
        'Zalando Sans Family',
        NULL,
        NULL,
        NULL,
        NULL,
        'other',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-ExtraBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815474-mmbjbk.ttf',
        NULL,
        '',
        67300,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-SemiBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815475-903q5.ttf',
        NULL,
        '',
        67228,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-BoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815476-i8srmc.ttf',
        NULL,
        '',
        67156,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-ExtraBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815477-6dfqse.ttf',
        NULL,
        '',
        67240,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-ExtraBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815476-ct6nkp.ttf',
        NULL,
        '',
        66104,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-Regular.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815480-2t58o.ttf',
        NULL,
        '',
        65608,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-Black.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815476-2fymkc.ttf',
        NULL,
        '',
        65952,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-ExtraBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815479-0f3ul8.ttf',
        NULL,
        '',
        65388,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-LightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815474-rwzqwh.ttf',
        NULL,
        '',
        66964,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-Bold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815476-p0eotg.ttf',
        NULL,
        '',
        66096,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-Italic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815479-er9frk.ttf',
        NULL,
        '',
        66580,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-Regular.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815485-oo9csl.ttf',
        NULL,
        '',
        65616,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-BlackItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815483-41gfnf.ttf',
        NULL,
        '',
        67340,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-Medium.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815484-eaqc0f.ttf',
        NULL,
        '',
        65572,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-Italic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815484-0bxx4.ttf',
        NULL,
        '',
        67416,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans-ExtraLightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815474-whe0o9.ttf',
        NULL,
        '',
        65644,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-Light.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815484-8nfv3.ttf',
        NULL,
        '',
        65580,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-Italic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815482-md45w.ttf',
        NULL,
        '',
        67144,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-Regular.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815482-r9zwgd.ttf',
        NULL,
        '',
        65216,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-Light.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815482-nb3qu7.ttf',
        NULL,
        '',
        65228,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-Bold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815479-yzf2s.ttf',
        NULL,
        '',
        65576,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-Italic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815477-vcwpih.ttf',
        NULL,
        '',
        65988,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-LightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815484-sjo0ip.ttf',
        NULL,
        '',
        67544,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-SemiBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815485-sqei7c.ttf',
        NULL,
        '',
        65440,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-Medium.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815480-glbg43.ttf',
        NULL,
        '',
        65584,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-ExtraBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815481-xidf1d.ttf',
        NULL,
        '',
        66376,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-ExtraBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815479-4bv3rm.ttf',
        NULL,
        '',
        66516,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-ExtraLightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815477-lk59pu.ttf',
        NULL,
        '',
        65500,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-Medium.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815482-3xsin3.ttf',
        NULL,
        '',
        65192,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-ExtraLightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815481-7kv4po.ttf',
        NULL,
        '',
        65916,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-ExtraBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815483-br9x1d.ttf',
        NULL,
        '',
        65380,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-ExtraBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815484-5psre.ttf',
        NULL,
        '',
        67472,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-BlackItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815481-ldpq09.ttf',
        NULL,
        '',
        68372,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-LightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815480-zjoca5.ttf',
        NULL,
        '',
        66664,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-BlackItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815478-owedx.ttf',
        NULL,
        '',
        66348,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-ExtraLight.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815484-luxocwq.ttf',
        NULL,
        '',
        65412,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-SemiBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815483-t26beq.ttf',
        NULL,
        '',
        67508,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-ExtraBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815481-c088fe.ttf',
        NULL,
        '',
        68440,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-LightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815482-xa46cp.ttf',
        NULL,
        '',
        67216,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiCondensed-Black.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815481-5uvlw8.ttf',
        NULL,
        '',
        66340,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-SemiBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815480-guho5h.ttf',
        NULL,
        '',
        65592,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-SemiBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815485-wrpv7.ttf',
        NULL,
        '',
        67456,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-LightItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815477-vy87yn.ttf',
        NULL,
        '',
        65856,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-BoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815483-l4oqm.ttf',
        NULL,
        '',
        67368,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-SemiBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815480-1u3sj.ttf',
        NULL,
        '',
        66712,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_SemiExpanded-Black.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815483-y28t9.ttf',
        NULL,
        '',
        65248,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-Light.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815480-cw3krg.ttf',
        NULL,
        '',
        65648,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-BoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815479-ew9rrd.ttf',
        NULL,
        '',
        66564,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-ExtraLight.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815479-365fzg.ttf',
        NULL,
        '',
        65372,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Expanded-MediumItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815480-by7v7s.ttf',
        NULL,
        '',
        66628,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-SemiBoldItalic.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815478-qt34nu.ttf',
        NULL,
        '',
        66488,
        'font',
        '[]',
        v_col_2
    );

    INSERT INTO assets (
        brand_id, name, description, file_url, thumbnail_url,
        file_type, file_size, category, tags, collection_id
    ) VALUES (
        v_new_brand_id,
        'ZalandoSans_Condensed-SemiBold.ttf',
        NULL,
        'https://vggbfpiknefwtccdhsvr.supabase.co/storage/v1/object/public/media/1768555815478-3hqd3.ttf',
        NULL,
        '',
        65608,
        'font',
        '[]',
        v_col_2
    );

    RAISE NOTICE 'Migration completed successfully.';
END $migration$ LANGUAGE plpgsql;
