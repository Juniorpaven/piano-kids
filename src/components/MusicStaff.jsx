import React from 'react';

// Maps Root Note to its base step offset (C4 = 0)
// C=0, D=1, E=2, F=3, G=4, A=5, B=6
export const ROOT_OFFSETS = {
    'C': 0,
    'D': 1,
    'E': 2,
    'F': 3,
    'G': 4,
    'A': 5,
    'B': 6
};

const MusicStaff = ({ noteName, offset }) => {
    // Canvas config
    const width = 160;
    const height = 140;

    // Config for lines
    // We want 5 lines. Standard Treble Staff usually covers E4 to F5.
    // E4 is Offset 2. F5 is Offset 9.
    // Let's position the staff vertically centered.
    // Lines are at offsets: 2(E), 4(G), 6(B), 8(D), 10(F).

    // Let's define Y of Offset 0 (C4 - Ledger Line).
    // Let's say Y=110.
    // Step Size (Space/Line height) = 10 px.
    // Then Offset 2 (E4 - Bottom Line) = 110 - (2 * 10) = 90.
    // Offset 10 (F5 - Top Line) = 110 - (10 * 10) = 10.
    // Staff Height = 80px (from 10 to 90).

    // Function to get Y for a given offset (C4=0, D=1, ... F5=10)
    // Center the staff in the 140px height.
    // Staff Height = 4 spaces * 10px = 40px.
    // Top Line (F5/Offset 10) Y = 50. Bottom Line (E4/Offset 2) Y = 90.
    // C4 (Offset 0) Y = 110.

    // Adjusted Config
    const bottomLineY = 90;
    const step = 10;

    const getY = (offset) => {
        // Offset 2 is Bottom Line (90).
        // Offset = 2 -> Y = 90.
        // Offset = 0 -> Y = 90 + 2*10 = 110.
        // General: Y = BottomLineY - ( (offset - 2) * step )
        return bottomLineY - ((offset - 2) * step);
    };

    // Staff Lines: E4(2), G4(4), B4(6), D5(8), F5(10)
    const staffLines = [2, 4, 6, 8, 10];
    const noteY = getY(offset);
    const stemDirection = offset >= 6 ? 'down' : 'up';
    const isSharp = noteName.includes('#');

    return (
        <div className="music-staff-container" style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            background: '#FFF', padding: '10px', borderRadius: '15px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
        }}>
            <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
                {/* Treble Clef - High Quality Path */}
                {/* Centered on the G-line (2nd line from bottom, offset 4, Y=70) */}
                <g transform="translate(15, 70) scale(0.045) translate(-300, -1300)">
                    {/* Standard Music Font G-Clef Path */}
                    <path fill="#333" d="M485 1195q-12 28 -34.5 53.5t-59.5 39.5t-68 14q-47 0 -81.5 -25t-34.5 -70q0 -46 29.5 -92t69.5 -81l40 -35q19 -16 28 -23t21 -25t12 -34.5t-6 -38t-30 -31.5t-41.5 -13q-34 0 -50 25.5t-16 63.5h-84q0 -37 13 -72.5t42.5 -59t76.5 -23.5q42 0 71 21.5t42 53.5t13 65q0 30 -16 64t-44 60.5 q-50 45 -71.5 67t-21.5 48q0 21 16.5 33.5t42.5 12.5q24 0 53 -18t50 -56l13 -120q-47 -46 -68 -91.5t-21 -94.5q0 -45 28.5 -79.5t73.5 -34.5q37 0 63 32.5t26 68.5q0 39 -22.5 73t-61.5 54l-11 96q21 -10 32 -10q33 0 54 23.5t21 58.5q0 26 -16 50t-45 39zM425 491 q0 -22 -15 -42t-37 -20q-26 0 -43 21t-17 46q0 23 16 43t40 20q24 0 41 -21t15 -47z" />
                </g>

                {/* Staff Lines */}
                {staffLines.map(off => (
                    <line key={off}
                        x1="35" y1={getY(off)}
                        x2={width - 15} y2={getY(off)}
                        stroke="#444" strokeWidth="2"
                    />
                ))}

                {/* Ledger Lines */}
                {/* Low C (0) or below */}
                {offset <= 0 && (
                    <line x1={width / 2 - 15} y1={getY(0)} x2={width / 2 + 15} y2={getY(0)} stroke="#444" strokeWidth="2" />
                )}
                {/* Middle C (0) usually needs note head ON the line */}

                {/* NOTE HEAD */}
                <ellipse cx={width / 2} cy={noteY} rx="7.5" ry="6" fill="#000" transform={`rotate(-15 ${width / 2} ${noteY})`} />

                {/* SHARP SYMBOL (#) */}
                {isSharp && (
                    <text x={width / 2 - 25} y={noteY + 8} fontSize="28" fontWeight="bold" fill="#000">♯</text>
                )}

                {/* NOTE STEM */}
                {stemDirection === 'up' ? (
                    <line x1={width / 2 + 6.5} y1={noteY} x2={width / 2 + 6.5} y2={noteY - 35} stroke="#000" strokeWidth="2" />
                ) : (
                    <line x1={width / 2 - 6.5} y1={noteY} x2={width / 2 - 6.5} y2={noteY + 35} stroke="#000" strokeWidth="2" />
                )}

            </svg>
            <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#D32F2F', marginTop: '-15px' }}>
                {noteName}
            </div>
        </div>
    );
};

export default MusicStaff;
