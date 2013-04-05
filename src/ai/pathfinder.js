/*global define*/
define(function() {

    // http://code.activestate.com/recipes/577457-a-star-shortest-path-algorithm/

    function Node(x,y,l,p) {
        this.x=x;
        this.y=y;
        this.level=d;
        this.priority=p;
    }


    Node.prototype.updatePriority = function(x1,y1) {
        var xd=x1-this.x;
        var yd=y1-this.y;

        var d = (xd*xd+yd*yd); /*TODO sqrt?*/

        this.priority = this.level + d*10;
    };

    Node.prototype.nextLevel = function(d,dirs) {
        this.level+=(dirs===8?(d%2===0?10:14):10);
    };

    function PathFinder(sn, diagonals) {

        this.sn = sn;
        this.ground = sn.map.groundLayer();
        this.xcount = this.data.width;
        this.ycount = this.data.height;
        var len = this.xcount*this.ycount;
        this.closedNodes = new Array(len);
        this.openNodes = new Array(len);
        this.directions = new Array(len);

        this.xdirections = diagonals?[1, 1, 0, -1, -1, -1, 0, 1]:[1, 0, -1, 0];
        this.ydirections = diagonals?[0, 1, 1, 1, 0, -1, -1, -1]:[0, 1, 0, -1];
    }

// // Determine priority (in the priority queue)
// bool operator<(const node & a, const node & b)
// {
//   return a.getPriority() > b.getPriority();
// }

    PathFinder.prototype.route = function(x0,y0,x1,y1) {
        static priority_queue<node> pq[2]; // list of open (not-yet-tried) nodes
        static int pqi; // pq index
        static node* n0;
        static node* m0;
        static int i, j, x, y, xdx, ydy;
        static char c;
        pqi=0;

        // reset the node maps
        for(y=0;y<m;y++)
        {
            for(x=0;x<n;x++)
            {
                closed_nodes_map[x][y]=0;
                open_nodes_map[x][y]=0;
            }
        }

        // create the start node and push into list of open nodes
        n0=new node(xStart, yStart, 0, 0);
        n0->updatePriority(xFinish, yFinish);
        pq[pqi].push(*n0);
        open_nodes_map[x][y]=n0->getPriority(); // mark it on the open nodes map

        // A* search
        while(!pq[pqi].empty())
        {
            // get the current node w/ the highest priority
            // from the list of open nodes
            n0=new node( pq[pqi].top().getxPos(), pq[pqi].top().getyPos(),
                         pq[pqi].top().getLevel(), pq[pqi].top().getPriority());

            x=n0->getxPos(); y=n0->getyPos();

            pq[pqi].pop(); // remove the node from the open list
            open_nodes_map[x][y]=0;
            // mark it on the closed nodes map
            closed_nodes_map[x][y]=1;

            // quit searching when the goal state is reached
            //if((*n0).estimate(xFinish, yFinish) == 0)
            if(x==xFinish && y==yFinish)
            {
                // generate the path from finish to start
                // by following the directions
                string path="";
                while(!(x==xStart && y==yStart))
                {
                    j=dir_map[x][y];
                    c='0'+(j+dir/2)%dir;
                    path=c+path;
                    x+=dx[j];
                    y+=dy[j];
                }

                // garbage collection
                delete n0;
                // empty the leftover nodes
                while(!pq[pqi].empty()) pq[pqi].pop();
                return path;
            }

            // generate moves (child nodes) in all possible directions
            for(i=0;i<dir;i++)
            {
                xdx=x+dx[i]; ydy=y+dy[i];

                if(!(xdx<0 || xdx>n-1 || ydy<0 || ydy>m-1 || map[xdx][ydy]==1
                    || closed_nodes_map[xdx][ydy]==1))
                {
                    // generate a child node
                    m0=new node( xdx, ydy, n0->getLevel(),
                                 n0->getPriority());
                    m0->nextLevel(i, direction count, 4 or 8);
                    m0->updatePriority(xFinish, yFinish);

                    // if it is not in the open list then add into that
                    if(open_nodes_map[xdx][ydy]==0)
                    {
                        open_nodes_map[xdx][ydy]=m0->getPriority();
                        pq[pqi].push(*m0);
                        // mark its parent node direction
                        dir_map[xdx][ydy]=(i+dir/2)%dir;
                    }
                    else if(open_nodes_map[xdx][ydy]>m0->getPriority())
                    {
                        // update the priority info
                        open_nodes_map[xdx][ydy]=m0->getPriority();
                        // update the parent direction info
                        dir_map[xdx][ydy]=(i+dir/2)%dir;

                        // replace the node
                        // by emptying one pq to the other one
                        // except the node to be replaced will be ignored
                        // and the new node will be pushed in instead
                        while(!(pq[pqi].top().getxPos()==xdx &&
                               pq[pqi].top().getyPos()==ydy))
                        {
                            pq[1-pqi].push(pq[pqi].top());
                            pq[pqi].pop();
                        }
                        pq[pqi].pop(); // remove the wanted node

                        // empty the larger size pq to the smaller one
                        if(pq[pqi].size()>pq[1-pqi].size()) pqi=1-pqi;
                        while(!pq[pqi].empty())
                        {
                            pq[1-pqi].push(pq[pqi].top());
                            pq[pqi].pop();
                        }
                        pqi=1-pqi;
                        pq[pqi].push(*m0); // add the better node instead
                    }
                    else delete m0; // garbage collection
                }
            }
            delete n0; // garbage collection
        }
        return ""; // no route found
    };

    return PathFinder;

});
