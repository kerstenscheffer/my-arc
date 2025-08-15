import React from 'react';

const Layout = ({ children, pageTitle, user }) => {
  return (
    <div className="myarc-app">
      {/* Header met MY ARC logo */}
      <header className="myarc-header">
        <div className="myarc-container">
          <div className="myarc-flex myarc-items-center myarc-justify-between">
            <div className="myarc-flex myarc-items-center myarc-gap-lg">
              <a href="#" className="myarc-logo">MY ARC</a>
              {pageTitle && (
                <h1 className="myarc-page-title">{pageTitle}</h1>
              )}
            </div>
            
            {user && (
              <div className="myarc-flex myarc-items-center myarc-gap-md">
                <div className="myarc-status-badge">
                  <span className="myarc-status-dot"></span>
                  Connected
                </div>
                <div className="myarc-user-info">
                  <div className="myarc-user-email">{user.profile?.email || user.email}</div>
                  <div className="myarc-user-role">{user.profile?.role || 'Coach'}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="myarc-main">
        <div className="myarc-container">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
