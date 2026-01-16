import { NavLink } from 'react-router-dom'
import { decodeHTMLEntities } from '../utils/decodeHtml'

export default function Sidebar({ navigation = [], brand }) {
    return (
        <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-100 overflow-y-auto py-8">
            <nav className="px-6 space-y-10">
                {navigation.map((section, sectionIndex) => (
                    <div key={sectionIndex}>
                        {/* Section Title */}
                        <h3 className="mb-4 text-xl font-bold text-gray-900 tracking-tight">
                            {decodeHTMLEntities(section.section)}
                        </h3>

                        {/* Section Pages */}
                        <ul className="space-y-3">
                            {section.pages.map((page) => (
                                <li key={page.slug}>
                                    <NavLink
                                        to={`/${page.slug}`}
                                        className={({ isActive }) => `
                                            block text-[15px] transition-colors
                                            ${isActive
                                                ? 'text-gray-900 font-medium'
                                                : 'text-gray-500 hover:text-gray-900'
                                            }
                                        `}
                                    >
                                        {decodeHTMLEntities(page.title)}
                                    </NavLink>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </nav>
        </aside>
    )
}

